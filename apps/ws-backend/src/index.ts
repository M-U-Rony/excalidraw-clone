import { JWT_SECRET } from "@repo/backend-common/config"
import websocket,{WebSocketServer} from 'ws'
import jwt from 'jsonwebtoken'
import {prismaClient} from '@repo/db/client'

interface User{
    userId: String,
    Ws: websocket,
    rooms: String[]
}

const allUser: User[] =[];

const wss = new WebSocketServer({port: 8080})

wss.on('connection', function connection(ws,request){

    const cookieHeader = request.headers.cookie || "";

    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((cookie) => {
        const [name, ...rest] = cookie.split("=");
        return [name!.trim(), rest.join("=")];
      })
    );

    const token = cookies.token;

    if (!token) {
      ws.close();
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string") {
      ws.close();
      return;
    }

    if (!decoded || !decoded.userId) {
      ws.close();
      return;
    }

    allUser.push({
      userId: decoded.userId,
      Ws: ws,
      rooms: [],
    })


    ws.on('message', async function message(data){

        const parsedData = JSON.parse(data.toString());
        console.log(parsedData)

        if(parsedData.type ==="join-room"){

            const user = allUser.find(x=> x.Ws === ws);
            user?.rooms.push(parsedData.roomId)

        }else  if(parsedData.type === "leave-room"){

            const user = allUser.find(x=> x.Ws === ws);

            if(!user){
                return
            }

            user.rooms = user?.rooms.filter(x => x=== parsedData.roomId)
            
        }else  if(parsedData.type ==="draw"){

            // await prismaClient.chat.create({
            //    data: {
            //     adminId: decoded.userId,
            //     messages: parsedData.shapes,
            //     roomId: parsedData.roomId,
            //    }
            // })

            allUser.forEach((user)=>{
                if(user.rooms.includes(parsedData.roomId) && user.Ws !== ws){
                    user.Ws.send(JSON.stringify({
                        type: 'draw',
                        shapes: parsedData.shapes,
                        roomId: parsedData.roomId
                    }))
                }
            })
        }
    })
})


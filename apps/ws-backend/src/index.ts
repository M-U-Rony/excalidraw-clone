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

    const url = request.url;

    if(!url){
        return
    }

    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token') || "";
    const decoded = jwt.verify(token,JWT_SECRET);

    if(typeof decoded == "string"){
        ws.close();
        return
    }

    if(!decoded || !decoded.userId){
        ws.close();
        return
    }

    allUser.push({
        userId: decoded.userId,
        Ws: ws,
        rooms: []
    })


    ws.on('message', async function message(data){

        const parsedData = JSON.parse(data.toString());
        // console.log(parsedData)

        if(parsedData.type ==="join-room"){

            const user = allUser.find(x=> x.Ws === ws);
            user?.rooms.push(parsedData.roomId)

        }else  if(parsedData.type === "leave-room"){

            const user = allUser.find(x=> x.Ws === ws);

            if(!user){
                return
            }

            user.rooms = user?.rooms.filter(x => x=== parsedData.roomId)
            
        }else  if(parsedData.type ==="chat"){

            await prismaClient.chat.create({
               data: {
                adminId: decoded.userId,
                messages: parsedData.message,
                roomId: Number(parsedData.roomId)
               }

            })

            allUser.forEach((user)=>{
                if(user.rooms.includes(parsedData.roomId)){
                    user.Ws.send(JSON.stringify({
                        type: 'chat',
                        message: parsedData.message,
                        roomId: parsedData.roomId
                    }))
                }
            })
        }
    })
})


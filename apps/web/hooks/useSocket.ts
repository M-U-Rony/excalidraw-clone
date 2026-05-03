"use client";

import { useEffect, useState } from "react";

export function useSocket(){

    const [socket, setSocket] = useState<WebSocket>();
    const [loading,setloading] = useState(true)

    useEffect(()=>{

        setloading(true);
        const ws = new WebSocket(`ws://localhost:8080`);

        ws.onopen = () =>{
            setloading(false)
            setSocket(ws);
            console.log('connected')
        }

        ws.onclose = () => {
            setSocket(undefined);
            console.log('disconnected')
        };

        return () => {
            ws.close();
        };
    },[])

    return{
        loading,socket
    }
}

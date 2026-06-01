"use client";

import { WS_BASE_URL } from "@repo/backend-common/config";
import { useEffect, useState } from "react";

export function useSocket(){

    const [socket, setSocket] = useState<WebSocket>();
    const [loading,setloading] = useState(true)

    useEffect(()=>{

        setloading(true);
        const ws = new WebSocket(`${WS_BASE_URL}`);

        ws.onopen = () =>{
            console.log('connected')
            setloading(false)
            setSocket(ws);
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

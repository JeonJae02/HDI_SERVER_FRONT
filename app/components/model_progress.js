'use client'

import { useEffect, useState } from "react"

export default function ModelProgress({className=""}){
    const [confidence, setConfidence] = useState(60.00001)
    const [accumulation, setAccumulation] = useState(10.03421)

    useEffect(()=>{
        const interval = setInterval(()=>{
            const add_confidence = Math.random() * 0.0005
            const add_accumulation = Math.random() * 0.0005

            setConfidence(prev => prev + add_confidence)
            setAccumulation(prev => prev + add_accumulation)

        }, 2000)

        return ()=>clearInterval(interval)
    },[])

    return(
        <div className={`${className}`}>
            <p>모델 신뢰도: {confidence.toFixed(4)}</p>
            <p>데이터 수집률: {accumulation.toFixed(4)}</p>
            <div className="bg-gradient-to-r from-[#2C68E7] via-[#6FA8FF] to-[#2C68E7] animate-slide" />
        </div>
    )
}
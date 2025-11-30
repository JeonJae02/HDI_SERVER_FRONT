'use client'
import { useEffect, useState } from "react"
import ModelProgress from "./components/model_progress"

export default function Home(){
  const [logs, setLogs] = useState([])
  const [details, setDetails] = useState([])
  const [matches, setMatches] = useState([])
  const [positions, setPositions] = useState([])
  const [sensors, setSensors] = useState([])
  // const [temp1, setTemp1] = useState([]) //temperature list 1 of bottom tanks
  // const [temp2, setTemp2] = useState([]) //temperature list 2 of bottom tanks
  // const [pressure, setPressure] = useState([])
  const tanks = ["워킹 Tank 1 BACK", "워킹 Tank 1 ISO", "워킹 Tank 2-1 SOFT", "워킹 Tank 2 MDI", "워킹 Tank 2-2 HARD", "워킹 Tank 3-1 고탄성", "워킹 Tank 3 ISO", "워킹 Tank 3-2 CUSH",]
  const threshold = 0.70

  useEffect(()=>{
    fetch("/json/tank_pos_matching.json")
    .then((res)=>res.json())
    .then((data)=>{
      setMatches(data)
    })
  },[])

    useEffect(() => {
    // 1. 우리가 만든 Flask 서버의 스트리밍 주소로 연결
    // (로컬 테스트 시 http://127.0.0.1:5000/api/stream)
    const eventSource = new EventSource("http://127.0.0.1:5001/api/stream");

    // 2. 서버에서 데이터가 들어올 때마다 실행되는 함수
    eventSource.onmessage = (event) => {
      // 들어온 데이터(문자열)를 JSON으로 변환
      const data = JSON.parse(event.data);

      // (1) 로그 업데이트
      // 백엔드가 이미 최신 로그 50개를 큐로 관리해서 보내주므로, 
      // 기존 것에 더하기(...prev)보다는 최신 상태로 덮어쓰는(setLogs)게 깔끔합니다.
      // 만약 누적해야 한다면 중복 제거 로직이 필요합니다.
      setLogs(data.logs); 

      // (2) 원인 분석 데이터 정렬 및 업데이트
      if (data.prediction && data.prediction.causes) {
        const sorted = data.prediction.causes.sort((a, b) => b.risk - a.risk);
        setDetails(sorted);
      }
      setSensors(data.sensors);
      
      // (3) 기타 센서 데이터나 시간 등도 필요하면 여기서 set함수 호출
      // setServerTime(data.server_time);
    };

    // 3. 에러 발생 시 처리
    eventSource.onerror = (error) => {
      console.error("SSE 연결 오류:", error);
      eventSource.close();
    };

    // 4. [매우 중요] 컴포넌트가 꺼질 때 연결 종료 (메모리 누수 방지)
    return () => {
      eventSource.close();
    };
  }, []);

  // useEffect(()=>{
  //   fetch("/json/back_example.json")
  //   .then((res)=>(res.json()))
  //   .then((data)=>{
  //     setLogs((prev)=>[...prev, ...data.logs])
  //     const sorted = data.prediction.causes
  //     .sort((a,b) =>b.risk - a.risk)

  //     setDetails(sorted)
  //     setSensors(data.sensors)
  //   })
  // },[])

  // //timestep, status, error message
  // useEffect(()=>{
  //   fetch("/json/err_log.json")
  //   .then((res)=>(res.json())
  //   .then((data)=>{
  //     setLogs((prev)=>{
  //       const merged = [...prev, ...data.logs]
  //       return merged.slice(-50)
  //     })
  //   })
  // )
  // }, [])

  // useEffect(()=>{
  //   fetch("/json/err_detail.json") 
  //   .then((res) => res.json())
  //   .then((data)=>{
  //     const sorted = data.items
  //     .sort((a,b) => b.weight - a.weight)
  //     .slice(0,3)

  //     setDetails(sorted)
  //   })
  // }, [])

  //temporary tank implementation - just generate values in random

  // useEffect(()=>{
  //   const interval = setInterval(()=>{
  //     const temp1 = Array.from({length: 8}, ()=>Math.floor(Math.random() * (30 - 10 + 1)) + 10)
  //     const temp2 = Array.from({length: 8}, ()=>Math.floor(Math.random() * (30 - 10 + 1)) + 10)
  //     const pressure = Array.from({length: 8}, ()=>Math.floor(Math.random() * (100 - 10 + 1)) + 10)

  //     setTemp1(temp1)
  //     setTemp2(temp2)
  //     setPressure(pressure)

  //   }, 2000)

  //   return () => clearInterval(interval)

  // },[])

  function getSensorForTank(tankName){
    let result = []
    for (const sensor in matches){
      if (matches[sensor].location.trim() === tankName.trim()){
        result.push({
          sensorId: sensor,
          factor: matches[sensor].factor,
          value: sensors[sensor]?.value,
          risk: sensors[sensor]?.risk
      })
      }
    }

    result.sort((a,b)=>a.factor.localeCompare(b.factor))

    return result
  }

  return(
    <div className="flex flex-col">
      <div className="relative w-full">
        <ModelProgress className="fixed top-2 right-7 text-white text-[14px] font-bold bg-gradient-to-l from-[#2C68E7] to-[#000000] px-4 py-5 bg-[length:200%_200%] animate-gradient-slide"/>
        <div className="flex w-full">
          <div className="px-10 py-15 h-[480px] w-[50%] overflow-y-scroll">{/*error log*/}
            {/*sticky top-0 z-10*/}
            <table className="table-auto border-white text-white w-[97%]">
              <thead className="bg-[#000000] rounded-xl">
                <tr>
                  <th className="px-4 py-2 text-center">발생 시각</th>
                  <th className="px-1 py-2 text-center w-[70px]">경보 상태</th>
                  <th className="px-4 py-2 text-center">경보 메세지</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx)=>{
                  const bgColor = (log.status == "OCCURRED")?
                  "bg-[#1054c1] text-center"
                  :idx % 2 === 0 ?
                  "bg-[#101010] text-center":
                  "bg-[#101010] text-center";

                  return(
                    <tr key={idx} className={bgColor}>
                      <td className="px-4 py-2 text-[12px]">{log.time}</td>
                      <td className="px-1 py-2 text-[12px]">{log.status == "RESOLVED" ? "해제됨" : "경고"}</td>
                      <td className="px-4 py-2 text-[12px]">{log.name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-15 pt-20 bg-black text-white h-[480px] w-[50%]">{/*error details*/}
            {details.map((detail, idx)=>(
              matches[detail.sensor] && (<div className="rounded-xl px-5 py-5 mb-5 shadow-[0_0_14px_rgba(255,255,255,0.3)]" key={idx}>
                <p className="font-bold text-[#2C68E7] text-18px mb-3">{idx + 1}순위</p>
                <p className="text-[14px]">문제의 원인은 {matches[detail.sensor]?.factor}이고, {matches[detail.sensor]?.location}에서 발생된 것으로 예상됩니다. <br/>신속한 점검을 권장드립니다.</p>
              </div>)
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col px-10 py-15 bg-black w-full mt-5"> {/*tank status color:z #2C68E7*/}
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${tanks.length / 2 }, minmax(0, 1fr))`}}>
          {tanks.map((tank, idx)=>{
            const tankName = tanks[idx]
            const sensorInfo = getSensorForTank(tankName)
            const tempList = sensorInfo.filter(item => item.factor === "Temp")
            const levelList = sensorInfo.filter(item => item.factor == "Level")
            const pressureList = sensorInfo.filter(item => item.factor === "Pressure")

            let temp = undefined
            let level = undefined
            let pressure = undefined
            let risks = []
            
            if(tempList.length != 0){
              temp = tempList[0].value / 100
              risks.push(tempList[0].risk)
            }
            if(levelList.length != 0){
              level = levelList[0].value / 100
              risks.push(levelList[0].risk)
            }
            if(pressureList.length != 0){
              pressure = pressureList[0].value / 10
              risks.push(pressureList[0].risk)
            }

            const tankClassName = Math.max(...risks) > threshold ? "bg-[#df3a66]" : "bg-[#5338f0]"
            const sensorClassName = Math.max(...risks) > threshold ? "bg-gradient-to-r from-[#df3a66] to-[#e42f41]" : "bg-gradient-to-r from-[#2C68E7] to-[#542aef]"

            return(
              <div className="relative" key={idx}> {/*tank image & card*/}
                <img src="/img/tank_normal.png" className="w-[80px] h-[130px]"/>
                <div className="absolute flex left-17 top-4 bg-white/70 text-black rounded-xl px-5 py-3">
                  <div className={`rounded-lg bg-[#5338f0] w-[100px] mr-3 shadow ${tankClassName} text-white text-center py-3 px-2`}>
                    <p className="text-[12px] mb-2">{tanks[idx].split(" ")[0]} {tanks[idx].split(" ")[1]} {tanks[idx].split(" ")[2]}</p>
                    <div className="border-b border-white-100"/>
                    <p className="text-[14px] font-bold mt-2">{tanks[idx].split(" ")[3]}</p>
                  </div>
                  <div className="flex flex-col">
                    {temp && <div className={`flex rounded-3xl px-1 py-1 ${sensorClassName} text-white w-[70px] mb-2 font-bold text-[12px]`}>
                      <img src="/img/temperature_white.svg" className="w-[15px] mr-2"/>
                      <p>{temp.toFixed(1)}°C</p>
                    </div>}
                    {level && <div className={`flex rounded-3xl px-1 py-1 ${sensorClassName} text-white w-[70px] mb-2 font-bold text-[12px]`}>
                      <img src="/img/water_white.svg" className="w-[15px] mr-2"/>
                      <p>{level.toFixed(1)}%</p>
                    </div>}
                    {pressure && <div className={`flex rounded-3xl px-1 py-1 ${sensorClassName} text-white w-[70px] mb-2 font-bold text-[12px]`}>
                      <img src="/img/pressure_white.svg" className="w-[15px] ml-1 mr-2"/>
                      <p>{pressure.toFixed(1)}VAR</p>
                    </div>}
                  </div>
                </div>
            </div>)
          })}
        </div>
      </div>
    </div>
  )
}
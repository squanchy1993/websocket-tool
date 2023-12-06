/*
 * @Date: 2023-12-03 12:31:31
 * @LastEditors: squanchy1993@yeah.net squanchy@yeah.net
 * @LastEditTime: 2023-12-06 20:40:29
 * @FilePath: /websocket-tool/src/App.tsx
 */
import { useState } from "react";
import styled from "styled-components";
import WsConfig from './component/WsConfig';
import WsStatus from './component/WsStatus';
import IntervalSend from './component/IntervalSend'
import TemporarySend from './component/TemporarySend'
import ConsoleLog from './component/ConsoleLog'
import MessageRecords from './component/MessageRecords'
import './App.css'
import { Socket } from "./component/socket";
import { Button } from "@mui/material";


const Container = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  & > .header {
    width: inherit;
    height: 60px;
    background-color: #007bff;
  }
  & > .body {
    width: inherit;
    flex: 1;
    .body-inner {
      height: calc(100% - 20px);
      width: 80%;
      margin: 10px 10%;
      display: flex;
      background-clip: border-box;
      border: 1px solid rgba(0, 0, 0, 0.125);
      border-radius: 5px;
      .left, .right {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 0 10px;
      }
      .left {
        width: 40%;
      }
      .right {
        width: 60%;
      }
    }
  }
`;
const socket = new Socket({ heartBeatConfig: { handleHeartBeatMsg: (msg) => msg.data.includes('heartbeat') } })
// socket.connect('ws://124.222.224.186:8800')
function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <Container>
        <section className="header"></section>
        <section className="body">
          <div className="body-inner">
            <div className="left">
              <Button onClick={() => socket.connect('ws://124.222.224.186:8800')}>链接</Button>
              <WsStatus />
              <WsConfig />
              <IntervalSend />
              <TemporarySend />
              <ConsoleLog />
            </div>
            <div className="right">
              <MessageRecords />
            </div>
          </div>
        </section>
      </Container>
    </>
  );
}

export default App;

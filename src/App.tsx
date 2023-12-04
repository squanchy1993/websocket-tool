/*
 * @Date: 2023-12-03 12:31:31
 * @LastEditors: 朱志森 826482354@qq.com
 * @LastEditTime: 2023-12-03 17:27:34
 * @FilePath: /websocket-tool/src/App.tsx
 */
import { useState } from "react";
import styled from "styled-components";
import CardItem from './component/CardItem';
import WsConfig from './component/WsConfig';
import WsStatus from './component/WsStatus';

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

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Container>
        <section className="header"></section>
        <section className="body">
          <div className="body-inner">
            <div className="left">
              <WsStatus />
              <WsConfig />
            </div>
            <div className="right">
              <CardItem title="发包设置" />
            </div>
          </div>
        </section>
      </Container>
    </>
  );
}

export default App;

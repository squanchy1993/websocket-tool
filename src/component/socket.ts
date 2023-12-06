/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * @Date: 2023-12-05 16:23:53
 * @LastEditors: squanchy1993@yeah.net squanchy@yeah.net
 * @LastEditTime: 2023-12-06 21:37:01
 * @FilePath: /websocket-tool/src/component/socket.ts
 */
enum SocketStatus {
  closed = "closed",
  connecting = "connecting",
  connected = "connected",
  closing = "closing",
}

interface promiseCb {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resovle: null | ((params: any) => void),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reject: null | ((params: any) => void),
}

interface HeartBeatConfig {
  handleHeartBeatMsg?: (msg: any) => boolean,
  timeout?: number,
  intervalTime?: number,
  sendMsg?: string
}

export class Socket {
  address: string = '';
  connectTimeout: number = 5000;

  wsInstance: WebSocket | null = null;
  connectStatus: SocketStatus = SocketStatus.closed;
  connectingCb: promiseCb = {
    resovle: null,
    reject: null,
  };
  closingCb: promiseCb = {
    resovle: null,
    reject: null,
  };

  pause: boolean = false;
  connectingTimer: number | null = null;
  closingTimer: number | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  heartBeat = {
    handleHeartBeatMsg: (msg: any) => true,
    timeout: 5000,
    intervalTime: 8000,
    sendMsg: '---- heartbeat ----'
  }

  constructor(params: {
    heartBeatConfig?: HeartBeatConfig
  }) {
    if (params.heartBeatConfig) {

      if (params.heartBeatConfig.handleHeartBeatMsg) {
        this.heartBeat.handleHeartBeatMsg = params?.heartBeatConfig?.handleHeartBeatMsg;
      }

      if (params.heartBeatConfig.timeout) {
        this.heartBeat.timeout = params.heartBeatConfig.timeout;
      }

      if (params.heartBeatConfig.intervalTime) {
        this.heartBeat.intervalTime = params.heartBeatConfig.intervalTime;
      }

      if (params.heartBeatConfig.sendMsg) {
        this.heartBeat.sendMsg = params.heartBeatConfig.sendMsg;
      }
    }

  }

  _setSocketInstance(address: string) {
    this.wsInstance = new WebSocket(address);

    // onopen
    this.wsInstance.onopen = (ev) => {
      console.info('onopen>>>', this.connectStatus, ev)
      if (this.connectStatus == SocketStatus.connecting) {
        this.connectStatus = SocketStatus.connected;
        this.connectingCb?.resovle?.({ success: true, message: '连接成功' });
        this._clearConnect();

        // start heartbeat;
        this._heartBeat.send();
      }
    };

    // onclose
    this.wsInstance.onclose = (ev) => {
      console.info('onclose>>>', this.connectStatus, ev)
      if (this.connectStatus == SocketStatus.closing) {
        this.connectStatus = SocketStatus.closed;
        this.closingCb?.resovle?.({ success: true, message: `关闭成功 :${ev}` });

        this._clearClose();
      }
    }

    // onerror
    this.wsInstance.onerror = (ev) => {
      console.info('onerror>>>', this.connectStatus, ev)
      if (this.connectStatus == SocketStatus.connecting) {
        this.connectStatus = SocketStatus.closed;
        this.connectingCb?.reject?.({ success: false, message: `开启失败 onerror:${ev}` });

        this._clearConnect();
      } else if (this.connectStatus == SocketStatus.closing) {
        this.connectStatus = SocketStatus.connecting;
        this.closingCb?.reject?.({ success: false, message: `关闭失败: onerror:${ev}` });

        this._clearClose();
      }
    }

    // onmessage
    this.wsInstance.onmessage = (ev) => {
      console.info('onmessage>>>', this.connectStatus, ev)
      this._heartBeat.received(ev);

      if (this.pause) {
        return;
      }
    }
  }

  _clearClose() {
    this.closingCb.resovle = null;
    this.closingCb.reject = null;
    if (this.closingTimer) {
      clearTimeout(this.closingTimer);
      this.closingTimer = null;
    }
  }
  _clearConnect() {
    this.connectingCb.resovle = null;
    this.connectingCb.reject = null;
    if (this.connectingTimer) {
      clearTimeout(this.connectingTimer);
      this.connectingTimer = null;
    }
  }

  _heartBeat = (() => {
    let timeoutTimer: null | number = null;
    const send = () => {
      this.wsInstance?.send(this.heartBeat.sendMsg);
      timeoutTimer = setTimeout(async () => {
        console.log('heartbeat timeout')
        this.constantlyReconnect.start();
      }, this.heartBeat.timeout)
    };


    let sendTimer: null | number = null;
    const received = (msg: any) => {

      // check is HeartBeatMsg
      const isHeartBeatMsg = this.heartBeat.handleHeartBeatMsg(msg);
      if (!isHeartBeatMsg) return;

      // clear send timeout timers;
      timeoutTimer && clearTimeout(timeoutTimer);

      if (sendTimer) return;
      sendTimer = setTimeout(() => {
        send()
        sendTimer && clearTimeout(sendTimer);
        sendTimer = null;
      }, this.heartBeat.intervalTime)
    }
    return {
      send,
      received
    }
  })();

  constantlyReconnect = (
    () => {
      let sendTimer: null | number = null;
      const start = () => {
        if (sendTimer) {
          return;
        }
        sendTimer = setTimeout(async () => {
          try {
            await this._close();
            await this.connect(this.address, this.connectTimeout);
            if (this.connectStatus == SocketStatus.connected) {
              stop();
            }
          } catch (error) {
            console.log('继续重试', error)
            stop();
            start();
          }
        }, 5000)
      }
      const stop = () => {
        sendTimer && clearTimeout(sendTimer);
        sendTimer = null
      }
      return {
        start,
        stop
      }

    }
  )();


  async connect(address: string, connectTimeout: number = 20000): Promise<object> {
    return new Promise((resovle, reject) => {
      if (this.connectStatus !== SocketStatus.closed) {
        return reject({ success: false, message: `eval connect failed: ${this.connectStatus}` })
      }

      this.address = address;
      this.connectTimeout = connectTimeout;
      this.connectingCb.resovle = resovle;
      this.connectingCb.reject = reject;

      // set socket instance
      this.connectStatus = SocketStatus.connecting;
      this._setSocketInstance(address);

      // connecting out of time;
      this.connectingTimer = setTimeout(() => {
        this.connectStatus = SocketStatus.closed;
        this.wsInstance?.close();
        reject({ success: false, message: '连接超时' });
        this._clearConnect();
      }, connectTimeout);
    })
  }

  async _close(): Promise<object> {
    return new Promise((resovle, reject) => {
      if (this.connectStatus !== SocketStatus.connected && this.connectStatus !== SocketStatus.closed ) {
        return reject({ success: false, message: `eval close() failed: ${this.connectStatus}` })
      }
      this.closingCb.resovle = resovle;
      this.closingCb.reject = reject;

      // set socket instance
      this.connectStatus = SocketStatus.closing;
      this.wsInstance?.close();

      // connecting out of time;
      this.closingTimer = setTimeout(() => {
        this.connectStatus = SocketStatus.closed;
        resovle({ success: false, message: '关闭超时,强行关闭' });
        this._clearClose()
      }, 2000);
    })
  }

  async closeConnect() {
    this.constantlyReconnect.stop();
    return this._close();
  }

  async throwErrorCode(){}
}
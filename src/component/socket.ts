/*
 * @Date: 2023-12-05 16:23:53
 * @LastEditors: zhusisheng zhusisheng@shenhaoinfo.com
 * @LastEditTime: 2023-12-05 19:09:15
 * @FilePath: \websocket-tool\src\component\socket.ts
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

export class Socket {
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

  _setSocketInstance(address: string) {
    this.wsInstance = new WebSocket(address);

    // onopen
    this.wsInstance.onopen = (ev) => {
      console.warn('onopen>>>', this.connectStatus, ev)
      if (this.connectStatus == SocketStatus.connecting) {
        this.connectStatus = SocketStatus.connected;
        this.connectingCb?.resovle?.({ success: true, message: '连接成功' });

        this._clearConnect();
      }
    };

    // onclose
    this.wsInstance.onclose = (ev) => {
      console.warn('onclose>>>', this.connectStatus, ev)
      if (this.connectStatus == SocketStatus.connecting) {
        this.connectStatus = SocketStatus.closed;
        this.connectingCb?.reject?.({ success: false, message: `开启失败 :${ev}` });

        this._clearConnect();
      } else if (this.connectStatus == SocketStatus.closing) {
        this.connectStatus = SocketStatus.closed;
        this.closingCb?.resovle?.({ success: true, message: `关闭成功 :${ev}` });

        this._clearClose();
      }
    }

    // onerror
    this.wsInstance.onerror = (ev) => {
      console.warn('onerror>>>', this.connectStatus, ev)
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
      console.warn('onmessage>>>', this.connectStatus, ev)
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

  async connect(address: string, time: number = 1000): Promise<void> {
    return new Promise((resovle, reject) => {
      if (this.connectStatus !== SocketStatus.closed) {
        return reject({ success: false, message: `eval connect failed: ${this.connectStatus}` })
      }
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
      }, time);
    })
  }

  async close(): Promise<void> {
    return new Promise((resovle, reject) => {
      if (this.connectStatus !== SocketStatus.connected) {
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
        reject({ success: false, message: '关闭超时,强行关闭' });
        this._clearClose()
      }, 3000);
    })
  }
}
'use strict';

import CanceledError from './CanceledError.js';

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @param {Function} executor The executor function.
 *
 * @returns {CancelToken}
 */
class CancelToken {
  constructor(executor) {
    if (typeof executor !== 'function') {
      throw new TypeError('executor must be a function.');
    }

    let resolvePromise;

    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });

    const token = this;

    // eslint-disable-next-line func-names
    // xhrAdapter适配器方法执行过程中取消网络请求的实现：
    // xhrAdapter添加取消请求方法到订阅队列中，token._listeners[i](cancel)执行处于队列中的方法达到目的。
    this.promise.then(cancel => {
      if (!token._listeners) return;

      let i = token._listeners.length;

      while (i-- > 0) {
        token._listeners[i](cancel);
      }
      token._listeners = null;
    });

    // eslint-disable-next-line func-names
    this.promise.then = onfulfilled => {
      let _resolve;
      // eslint-disable-next-line func-names
      const promise = new Promise(resolve => {
        token.subscribe(resolve);
        _resolve = resolve;
      }).then(onfulfilled);

      promise.cancel = function reject() {
        token.unsubscribe(_resolve);
      };

      return promise;
    };

    executor(function cancel(message, config, request) {
      if (token.reason) {
        // Cancellation has already been requested
        return;
      }

      token.reason = new CanceledError(message, config, request);
      resolvePromise(token.reason);
    });
  }

  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  // 请求拦截器执行之后到请求适配器执行之前 或 适配器执行之后到响应拦截器执行之前 取消请求的实现：
  // 在以上场景调用cancel()方法后,this.reason被赋值CanceledError对象。存在这个对象的情况下，直接抛出这个对象
  // 让响应拦截器的Promise的catch回调方法捕获到CanceledError错误对象，在捕获到后调用isCancel()方法得知是否为用户主动取消请求进而进一步处理逻辑。
  // lib\core\dispatchRequest.js中调用throwIfCancellationRequested(config)可以理解它将错误对象给到响应拦截器捕获处理。
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }

  /**
   * Subscribe to the cancel signal
   */
  // 主动取消请求方法的订阅队列
  subscribe(listener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }

    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }

  /**
   * Unsubscribe from the cancel signal
   */
  // 主动取消请求方法的取消订阅
  unsubscribe(listener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }

  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let cancel;
    const token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token,
      cancel
    };
  }
}

export default CancelToken;

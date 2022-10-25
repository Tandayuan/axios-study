'use strict';
/**
 * 学习记录：
 * Axios的入口文件，通过创建一个axios实例供外部使用。
 */
import utils from './utils.js';
import bind from './helpers/bind.js';
import Axios from './core/Axios.js';
import mergeConfig from './core/mergeConfig.js';
import defaults from './defaults/index.js';
import formDataToJSON from './helpers/formDataToJSON.js';
import CanceledError from './cancel/CanceledError.js';
import CancelToken from './cancel/CancelToken.js';
import isCancel from './cancel/isCancel.js';
import {VERSION} from './env/data.js';
import toFormData from './helpers/toFormData.js';
import AxiosError from './core/AxiosError.js';
import spread from './helpers/spread.js';
import isAxiosError from './helpers/isAxiosError.js';

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 *
 * @returns {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  
  const context = new Axios(defaultConfig);
  //context设置为request的上下文，返回一个新的request方法变量。createInstance创建出的实例本质是一个request方法声明。
  const instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance // axios.get()、axios.post()等Axios Class原型上有的方法都拷贝到当前实例中。
  utils.extend(instance, Axios.prototype, context, {allOwnKeys: true});

  // Copy context to instance // 指定拷贝好的方法的上下文
  utils.extend(instance, context, null, {allOwnKeys: true});

  // Factory for creating new instances //待学习：工厂函数的应用
  // create方法合并覆盖默认的配置对象，如：指定统一请求的URL、默认的请求方法等。
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  return instance;
}

// Create the default instance to be exported
const axios = createInstance(defaults);

/**
 * axios实例的一些其他方法的绑定
 */

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Expose Cancel & CancelToken
axios.CanceledError = CanceledError;
axios.CancelToken = CancelToken;
axios.isCancel = isCancel;
axios.VERSION = VERSION;
axios.toFormData = toFormData;

// Expose AxiosError class
axios.AxiosError = AxiosError;

// alias for CanceledError for backward compatibility
axios.Cancel = axios.CanceledError;

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};

axios.spread = spread;

// Expose isAxiosError
axios.isAxiosError = isAxiosError;

axios.formToJSON = thing => {
  return formDataToJSON(utils.isHTMLForm(thing) ? new FormData(thing) : thing);
};

export default axios

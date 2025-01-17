# Axios的大致执行流程
1. 入口函数在index.js 
2. lib/axios.js 是Axios的实例，每次我们引入Axios都会创建一个实例供使用。
3. lib/core/Axios.js 就是Axios的核心类，实例就是通过new 这个类出来的。
4. 核心类的原型方法声明了平时使用的get、post等方法，其实都是核心类方法request的参数别名，调用的都是request()。request()是帮我们快速发起http请求的方法，axios的核心方法。
5. 观察request方法可以知道返回值是promise对象，request中的dispatchRequest()方法负责携带用户的参数配置，用xhr的方式发起http请求。
6. dispatchRequest()方法中adapter方法就是实现了xhr的方式发起http请求的功能，具体实现查看lib\adapters\xhr.js，返回的是携带了服务器返回数据以及用户的配置等数据的promise对象。
# Axios创建实例的过程理解
1. 配置对象位置：`lib\defaults\index.js`
2. 28~55行解析实例创建过程： `lib\axios.js`
# 理解Axios链式调用的原理
1. 拦截器类源码：`lib\core\InterceptorManager.js`
2. 87~125行实现Promise链式调用：`lib\core\Axios.js`
# Axios拦截器的实现和理解
1. 拦截器类源码：`lib\core\InterceptorManager.js`
2. 实现思路：创建一个栈，存放若干个拦截器对象，对象中包括Promise决议和拒绝的回调函数等。源码中用use()方法把拦截器对象添加到栈中，且返回在栈中的元素索引。索引是拦截器对象的Id,实现移除栈中某个对象的方法eject()。forEach方法遍历栈中所有元素，并且元素作为forEach回调函数的参数去使用。（场景：理解Axios链式调用的原理）
# 理解发起网络请求的核心方法dispatchRequest()
1. 位置：`lib\core\dispatchRequest.js`;
2. 大体是对config中的请求头(headers)、请求体(data)进行数据的转换或处理后，再利用适配器adapter实现在node或者浏览器环境下发起网络请求。adapter返回的是一个Promise对象，dispatchRequest()函数返回的也是Promise对象。
# dispatchRequest()中adapter适配器模式的实现 (重点)
主要学习：适配器模式。
1. 适配器被调用的路径：`lib\core\dispatchRequest.js`的46行。
2. 适配器定义路径：`lib\defaults\index.js` 的 65行、22~32行。getDefaultAdapter()实现适配器的目的，判断axios所运行的是什么环境进而使用不同类型的适配器发起网络请求(node的http库 浏览器的xhr库)。
3. 适配器实现路径: `lib\adapters\index.js`。返回所处环境下的node或xhr适配器的实现函数。
4. xhr适配器路径： `lib\adapters\xhr.js` ，http适配器路径：`lib\adapters\http.js`。
# adapter中xhr适配器的实现理解
1. 源码路径：`lib\adapters\xhr.js`
2. 对传入的`config`对象数据处理或转换
3. `let request = new XMLHttpRequest();` 创建一个xhr的请求实例对象。
4. open()方法初始化xhr的请求参数、注册xhr对象的onloadend,onabort,onerror,ontimeout事件监听和回调函数。
5. xhr对象中配置一些业务遇到的场景，用户按需选配加入到xhr对象中。
6. 关键：适配器函数返回一个Promise对象，因此onloadend是resolve服务器响应数据以及一些config组成的Promise对象。剩下的
onabort,onerror,ontimeout都是reject一个错误对象，反馈错误原因给上游处理。
# 主动取消网络请求的两种情况实现理解
1. 第一种：
    + 情况：请求拦截器执行之后到请求适配器执行之前主动取消
    + 情况：配器执行之后到响应拦截器执行之前主动取消
    + 源码实现路径：`lib\cancel\CancelToken.js`中throwIfRequested()
    + 调用场景路径：`lib\core\dispatchRequest.js`中调用throwIfCancellationRequested(config)之处。
    + 实现思路：调用主动取消请求方法cancel(),CancelToken实例中this.reason被赋值CanceledError对象。throwIfCancellationRequested(config)中调用CancelToken.throwIfRequested(),throwIfRequested中判断reason有值时抛出reason的值也就是被赋值的错误对象。相应拦截器会捕获到主动取消请求的错误对象，并进行逻辑处理。
2. 第二种:
    + 情况：已经开始执行xhr适配器方法,并且在发送网络请求request.send()之前主动取消
    + 源码实现路径：`lib\cancel\CancelToken.js`中subscribe()、unsubscribe()以及CancelToken的构造函数29-38行的`token._listeners[i](cancel)`关键代码。
    + 调用场景路径： `lib\adapters\xhr.js`中done()、onCanceled()以及`config.cancelToken && config.cancelToken.subscribe(onCanceled)`
    + 实现思路：实现xhr请求取消的方法onCanceled()加入到主动取消请求队列中`subscribe(onCanceled)`,等待主动取消请求方法cancel()的调用。当cancel()调用后,CancelToken的构造的Promise从待决议变成敲定状态从而链式执行下去`resolvePromise(token.reason)`,并且reason对象作为Promise的第一个返回值传递下去`this.reason = new CanceledError(message, config, request)`。当执行第一个Promise.then时,reason对象作为onfulfilled回调方法的参数同时传递给`token._listeners[i](cancel)`执行取消请求订阅队列中的方法,这个方法调用xhr的原生api实现`request.abort()`实现xhr的请求取消，同时也抛出CanceledError错误对象给响应拦截器捕获处理主动取消请求的逻辑。
    + 附加说明：如果config配置了`config.cancelToken`，那么在xhr请求发出之前会被默认添加到取消请求队列。但是直至xhr适配器执行完都没有调用cancel()的情况下,会执行done()方法。这个方法主要实现删除默认添加进订阅队列的方法。
3. 实现关键核心点：`lib\cancel\CancelToken.js`
    ```javascript
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
    ```

    ```javascript 
    executor(function cancel(message, config, request) {
        if (token.reason) {
            // Cancellation has already been requested
            return;
        }

        token.reason = new CanceledError(message, config, request);
        resolvePromise(token.reason);
    });
    ```
    
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
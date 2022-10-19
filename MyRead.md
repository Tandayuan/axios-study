# Axios的大致执行流程
1. 入口函数在index.js
2. lib/axios.js 是Axios的实例，每次我们引入Axios都会创建一个实例供使用。
3. lib/core/Axios.js 就是Axios的核心类，实例就是通过new 这个类出来的。
4. 核心类的原型方法声明了平时使用的get、post等方法，其实都是核心类方法request的参数别名，调用的都是request()。request()是帮我们快速发起http请求的方法，axios的核心方法。
5. 观察request方法可以知道返回值是promise对象，request中的dispatchRequest()方法负责携带用户的参数配置，用xhr的方式发起http请求。
6. dispatchRequest()方法中adapter方法就是实现了xhr的方式发起http请求的功能，具体实现查看lib\adapters\xhr.js，返回的是携带了服务器返回数据以及用户的配置等数据的promise对象。
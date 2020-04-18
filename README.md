MyCuckoo-UI
========

用户权限管理平台用户界面UI

# 前述
1. 此项是笔记, 以精小完整的工程记录遇到的事, 学到的经, 收集点滴
2. 此项是坚持, 初有萌芽, 接而立项, 后有执行, 过程曲折, 枯燥乏味, 需心静不变的坚持
3. 此项是态度, 不畏事小, 不厌反复, 没有坚持不会有果

# 特性
1. 基于`layui`前端框架
2. 搭配后端`mycuckoo`, 实现前后端分离
3. 可独立部署, 亦可打成`jar`包被依赖(基于`webjar`技术)
4. 独立部署时修改`mycuckoo.api.js`文件的`host`所指向真实后端接口地址
5. 打成`jar`包时, 在mycuckoo中添加依赖, 直接启动mycuckoo项目, 访问地址: `localhost:8080/login.html`

# 效果:

登录页:
![登录页](static/demo/login.png)

主页:
![主页](static/demo/index.png)

菜单管理:
![菜单管理](static/demo/menuMgr.png)

系统配置:
![系统配置](static/demo/systemConfig.png)
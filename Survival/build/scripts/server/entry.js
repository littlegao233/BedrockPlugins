(() => {
    const defines = {};
    const entry = [null];
    function define(name, dependencies, factory) {
        defines[name] = { dependencies, factory };
        entry[0] = name;
    }
    define("require", ["exports"], (exports) => {
        Object.defineProperty(exports, "__cjsModule", { value: true });
        Object.defineProperty(exports, "default", { value: (name) => resolve(name) });
    });
    define("system", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        checkApiLevel(1);
    });
    define("main", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        //需要把所有的玩家都加进来
        var tick = 0; //1/20秒
        var playerList = [];
        //var playerMap:{[key:string] : IEntity} = {};
        const system = server.registerSystem(0, 0);
        system.initialize = function () {
            server.log("生存v0.1 Loaded by haojie06");
            //注册自定义组件
            system.registerComponent("survival:player_state", {
                //口渴 100为满
                thirsty: 100,
                //骨折 75 50 25  四个等级 造成缓慢/挖掘疲劳 每分钟恢复10 喝牛奶恢复?
                broken: 100,
                //烧伤 造成虚弱
                burn: 100
            });
            system.listenForEvent("minecraft:entity_created", onPlayerCreate);
            //system.listenForEvent("minecraft:entity_death",onPlayerLeave);
            this.registerCommand("status", {
                description: "查看身体状况",
                permission: 0,
                overloads: [{
                        parameters: [],
                        handler(origin) {
                            let component;
                            let info = system.actorInfo(origin.entity);
                            for (let player of playerList) {
                                let playerInfo = system.actorInfo(player);
                                if (info.name == playerInfo.name) {
                                    component = system.getComponent(player, "survival:player_state");
                                }
                            }
                            this.openModalForm(origin.entity, JSON.stringify({
                                type: "form",
                                title: "status",
                                content: "你当前的身体状况",
                                buttons: [{
                                        text: `口渴值: ${component.data.thirsty}`,
                                        image: { type: "url", data: "https://s2.ax1x.com/2019/06/13/VfC7dA.png" }
                                    },
                                    {
                                        text: `感染值: 0`,
                                        image: { type: "url", data: "https://s2.ax1x.com/2019/06/18/VL58r4.png" }
                                    },
                                    {
                                        text: `饥渴值:我开玩笑的,不要举报我`,
                                        image: { type: "url", data: "https://s2.ax1x.com/2019/06/18/VLIeyD.png" }
                                    }] //https://s2.ax1x.com/2019/06/18/VL5fRf.jpg
                            }));
                        }
                    }]
            });
            this.checkUse((player, info) => {
                if (info.item.name == "potion") {
                    server.log("正在喝水");
                }
            });
            //注册查询命令
        };
        //每tick一次 0.05s
        system.update = function () {
            tick++;
            //server.log("update--" + tick + "playerList:" + playerList.length);
            if (tick >= 20) {
                //1s
                updateStatus(playerList);
                tick = 0;
                //检测，刷新状态
            }
        };
        function updateStatus(playerList) {
            if (playerList.length != 0) {
                for (let player of playerList) {
                    //server.log(JSON.stringify(player));
                    try {
                        let info = system.actorInfo(player);
                        let component = system.getComponent(player, "survival:player_state");
                        //测试 每秒口渴指数降低1
                        //server.log("当前口渴值--" + component.data.thirsty);
                        if (component.data.thirsty > 1) {
                            component.data.thirsty -= 1;
                        }
                        else if (component.data.thirsty == 1) {
                            //提醒玩家
                            server.log("提醒玩家");
                            system.invokeConsoleCommand("§eSurvival", `tell ${info.name} §c口好渴啊！`);
                            component.data.thirsty = 0;
                        }
                        else {
                        }
                        system.applyComponentChanges(player, component);
                    }
                    catch (err) {
                        server.log("出现错误");
                    }
                }
            }
            else { }
        }
        function onPlayerCreate(data) {
            var entity = data.entity;
            if (!entity)
                throw "not entity";
            if (entity.__identifier__ == "minecraft:player") {
                server.log("玩家创建,注册组件,添加至列表");
                system.createComponent(entity, "survival:player_state");
                playerList.push(entity);
            }
        }
        function onPlayerLeave(data) {
            var entity = data.entity;
            if (!entity)
                throw "not entity";
            if (entity.__identifier__ == "minecraft:player") {
                server.log("玩家离开，移除列表");
                playerList.splice(playerList.indexOf(entity), 1);
            }
        }
    });
    
    'marker:resolver';

    function get_define(name) {
        if (defines[name]) {
            return defines[name];
        }
        else if (defines[name + '/index']) {
            return defines[name + '/index'];
        }
        else {
            const dependencies = ['exports'];
            const factory = (exports) => {
                try {
                    Object.defineProperty(exports, "__cjsModule", { value: true });
                    Object.defineProperty(exports, "default", { value: require(name) });
                }
                catch (_a) {
                    throw Error(['module "', name, '" not found.'].join(''));
                }
            };
            return { dependencies, factory };
        }
    }
    const instances = {};
    function resolve(name) {
        if (instances[name]) {
            return instances[name];
        }
        if (name === 'exports') {
            return {};
        }
        const define = get_define(name);
        instances[name] = {};
        const dependencies = define.dependencies.map(name => resolve(name));
        define.factory(...dependencies);
        const exports = dependencies[define.dependencies.indexOf('exports')];
        instances[name] = (exports['__cjsModule']) ? exports.default : exports;
        return instances[name];
    }
    if (entry[0] !== null) {
        return resolve("main");
    }
})();
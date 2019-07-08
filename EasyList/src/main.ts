import { MySystem } from "./system";
import {db,SELECT_WHITELIST_BY_MSG,SELECT_NAME_IN_LIST, DELETE_NAME_IN_LIST, SELECT_ALL_IN_LIST, INSERT_LIST} from "./database"
const system = server.registerSystem<MySystem>(0, 0);
var tick = 0,tick2 = 0;
var playerBanedInfoList:string[] = [];
var playerNotInWhitelist:string[] = [];
var playerQuery;
system.initialize = function() {
  server.log("黑白名单 v3.0 loaded");
  system.listenForEvent("minecraft:entity_created",onPlayerJoin);

  this.registerSoftEnum("whitelist_enum", ["add","remove"]);
  //注册自定义组件，用于标识玩家
  system.registerComponent("fakeban:isplayer", {});

  playerQuery = system.registerQuery();
  system.addFilterToQuery(playerQuery,"fakeban:isplayer")
  this.registerCommand("fban", {
    description: "封禁",
    permission: 1,
    overloads: [
    {
        parameters: [
        {
            type: "string",
            name: "target"
        },
        {
            type: "message",
            name: "message",
            optional: true
        }
        ],
        handler(origin, [target, msg]) {
        let $kind = "blacklist";
        let $name = target;
        let $msg = " ";
        if(msg != ""){
        $msg = msg;
        }
        db.update(INSERT_LIST,{
          $name,
          $kind,
          $msg
      });
      //查询一下他是否有多个id
      let datas = Array.from(db.query(SELECT_WHITELIST_BY_MSG,{$msg}));
      playerBanedInfoList.push($name);
      system.broadcastMessage(`§c已封禁${$name} ${$msg}`);
      }
    } as CommandOverload<MySystem, ["string", "message"]>
    ]
});




this.registerCommand("funban", {
  description: "解封",
  permission: 1,
  overloads: [
  {
      parameters: [
      {
          type: "string",
          name: "target"
      }
    ],
      handler(origin, [target]) {
      let $kind = "blacklist";
      let $name = target;
      db.update(DELETE_NAME_IN_LIST,{
        $name,
        $kind
    });
    let index = playerBanedInfoList.indexOf($name);
    if(index >= 0){
      playerBanedInfoList.splice(index,1);
    }
    system.broadcastMessage(`§a已解封${$name}`);
    }
  } as CommandOverload<MySystem, ["string"]>
  ]
});


this.registerCommand("fwhitelist", {
  description: "白名单",
  permission: 1,
  overloads: [
  {
      parameters: [
      {
          type: "soft-enum",
          name: "action",
          enum: "whitelist_enum"
      },
      {
          type: "string",
          name: "target"
      },
      {
        type: "message",
        name: "message",
        optional: true
      }
      ],
      handler(origin, [action, target, msg]) {
      if(action == "add"){
      let $name = target;
      let $msg = "未知qq";
      let $kind = "whitelist";
      if(msg != ""){
      $msg = msg;
      }
      db.update(INSERT_LIST,{
        $name,
        $kind,
        $msg
    });
    playerNotInWhitelist.splice(playerNotInWhitelist.indexOf(target),1);
    let datas = Array.from(db.query(SELECT_WHITELIST_BY_MSG,{$msg}));
    if(datas.length != 0){
      //玩家这个qq已经注册过白名单了
      system.broadcastMessage(`§a已为${$name}添加白名单 ${$msg}`);
      let namelist;
      for(let index in datas){
        if(index == '0'){
          namelist = datas[index].name;
        }
        else{
        namelist = namelist + "," + datas[index].name;
      }
    }
      system.broadcastMessage(`§e玩家已有账号：§r\n${namelist}`);
    }
    else{
    system.broadcastMessage(`§a已为${$name}添加白名单 ${$msg}`);
    }
  }
  else if (action == "remove"){
    let $name = target;
    let $kind = "whitelist";
    db.update(DELETE_NAME_IN_LIST,{$name,$kind});
    playerNotInWhitelist.push($name);

    system.broadcastMessage(`§a已移除${$name}的白名单 ${msg}`);
  }
    }
  } as CommandOverload<MySystem, ["soft-enum","string", "message"]>
  ]
});

this.registerCommand("fkick",{
  description: "踢掉",
  permission: 1,
  overloads: [{
    parameters:[
      {
        type: "player-selector",
        name: "target"
      }
    ],
    handler(original,[target]){
      const info = this.actorInfo(target[0]);
      system.broadcastMessage(`§c踢出${info.name}`);
      system.destroyEntity(target[0]);
    }
  }as CommandOverload<MySystem, ["player-selector"]>
  ]
})
};

//每tick一次 0.05s
system.update = function(){
  tick++;
  tick2++;
  if (tick >= 20){
    //1s
    tick = 0;
    let entities = system.getEntitiesFromQuery(playerQuery);
    //server.log(`当前玩家数:${entities.length} 名单长度:${playerBanedInfoList.length}`);
      for (let enti of entities){
        let info = system.actorInfo(enti);
        //找到了名字对应的实体
        if(playerBanedInfoList.indexOf(info.name) >= 0){
          try{
            //直接摧毁实体也会导致掉线
            /*
            system.invokeConsoleCommand("ban",`clear ${info.name}`);
            system.invokeConsoleCommand("ban",`effect ${info.name} slow_falling 100 10 false`);
            system.invokeConsoleCommand("ban",`effect ${info.name} blindness 1000 10 false`);
            let component = system.getComponent(enti, MinecraftComponent.Position);
          //修改组件
          component.data.x = 0;
          component.data.y = 250;
          component.data.z = 0;
          system.applyComponentChanges(enti, component);
          system.invokeConsoleCommand("ban",`title ${info.name} title §4你已被封禁`);
          */
          system.destroyEntity(enti);
        }catch(err){server.log("实体已不存在");}
      }
      else if(playerNotInWhitelist.indexOf(info.name) >= 0){
        try{
        const world = system.worldInfo();
        const [x, y, z] = world.spawnPoint;
        let component = system.getComponent(enti, MinecraftComponent.Position);
        //修改组件
        component.data.x = x;
        component.data.y = y;
        component.data.z = z;
        system.applyComponentChanges(enti, component);
        system.invokeConsoleCommand("whitelist",`title ${info.name} title §3你还没有获得白名单哦，在qq群内获得`);
      }catch(err){server.log("实体已不存在");}
    }
    }      
  }
  if(tick2 >= 1200){
    tick2 = 0;
    //检查list中的玩家是否还在线
    let entities = system.getEntitiesFromQuery(playerQuery);
    let curNameList:string[] = [];
    for (let enti of entities){
      let info = system.actorInfo(enti);
      curNameList.push(info.name);
    }
    for (let index in playerBanedInfoList){
      if(curNameList.indexOf(playerBanedInfoList[index]) < 0){
        server.log(`${playerBanedInfoList[index]}已经离线，清除`);
        playerBanedInfoList.splice(Number(index),1);
      }
    }

    for (let index in playerNotInWhitelist){
      if(curNameList.indexOf(playerNotInWhitelist[index]) < 0){
        server.log(`${playerNotInWhitelist[index]}已经离线，清除`);
        playerNotInWhitelist.splice(Number(index),1);
      }
    }
  }
}

function onPlayerJoin(data){
  let entity = data.entity;
  if (!entity) throw "not entity";
  if (entity.__identifier__ == "minecraft:player") {
    let info = system.actorInfo(data.entity);
    server.log(`玩家${info.name}加入游戏`);
    //给玩家加上标识组件
    system.createComponent(entity,"fakeban:isplayer");
    //先检查黑名单 后检检查白名单
    let $name = info.name;
    let $kind = "blacklist";
    let datas;
    try {
    datas = Array.from(db.query(SELECT_NAME_IN_LIST,{$name,$kind}));
    }catch(err){
      server.log("出现错误");
    }
    if(datas.length != 0){
      server.log("玩家在黑名单内");
      playerBanedInfoList.push(info.name);
    }
    else{
      server.log("玩家不在黑名单内");
    //接着检测白名单
    $kind = "whitelist";
    datas = Array.from(db.query(SELECT_NAME_IN_LIST,{$name,$kind}));
    if(datas.length > 0){
      server.log("玩家在白名单内");
      //welcome
      system.invokeConsoleCommand("ban",`title ${info.name} title §e你拥有白名单，游戏愉快`);
      //playerBanedInfoList.push(info.name);
    }
    else{
      server.log("玩家不在白名单内");
      playerNotInWhitelist.push($name);
    }
  }
    }
  }


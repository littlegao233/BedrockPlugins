import {getName,checkAdmin,getTime,getDimensionOfEntity} from "../utils";
import {system,playerKicked,kickTickReset,IUseCraftTableComponent} from "../system";
import {db,INSERT_MISB,QUERY_ALL_MISB,QUERY_MISB_BYNAME} from "../database";

let playerQuery;
let cannotPushContainerList = ["minecraft:smoker","minecraft:barrel","minecraft:blast_furnace","minecraft:grindstone","minecraft:crafting_table","minecraft:dropper","minecraft:hopper","minecraft:trapped_chest","minecraft:lit_furnace","minecraft:furnace","minecraft:chest","minecraft:dispenser"];
let unusualBlockList = ["minecraft:spawn_egg","minecraft:invisibleBedrock","minecraft:invisiblebedrock","minecraft:bedrock","minecraft:mob_spawner","minecraft:end_portal_frame","minecraft:barrier","minecraft:command_block"];
let enchMap = new Map<string,string>();
let levelMap = new Map<string,number>();

enchMap.set("0","protection");
enchMap.set("1","fire_aspect");
enchMap.set("2","feather_falling");
enchMap.set("3","blast_protection");
enchMap.set("4","projectile_protection");
enchMap.set("5","thorns");

enchMap.set("6","respiration");
enchMap.set("7","depth_strider");
enchMap.set("8","aqua_affinity");
enchMap.set("9","sharpness");
enchMap.set("10","smite");
enchMap.set("11","bane_of_arthropods");

enchMap.set("12","knockback");
enchMap.set("13","fire_aspect");
enchMap.set("14","looting");
enchMap.set("15","efficiency");
enchMap.set("16","silk_touch");
enchMap.set("17","unbreaking");

enchMap.set("18","fortune");
enchMap.set("19","power");
enchMap.set("20","punch");
enchMap.set("21","flame");
enchMap.set("22","infinity");
enchMap.set("23","luck_of_the_sea");

enchMap.set("24","lure");
enchMap.set("25","frost_walker");
enchMap.set("26","mending");
enchMap.set("27","");
enchMap.set("28","");
enchMap.set("29","impaling");

enchMap.set("30","riptide");
enchMap.set("31","loyalty");
enchMap.set("32","channeling");



export function ItemModuleReg() {
    server.log("防物品作弊模块已加载");
    let date = new Date();

//阻止普通玩家放置不应该放置的东西（基岩/刷怪箱...）
system.listenForEvent("minecraft:player_placed_block",data=>{
    let player = data.data.player;
    if(!checkAdmin(player)){
        let bPosition = data.data.block_position;
        let playerName = getName(player);
        //不是op才需要进行判断
        let tickAreaCmp = system.getComponent<ITickWorldComponent>(player,MinecraftComponent.TickWorld);
        let tickingArea = tickAreaCmp.data.ticking_area;
        let placeBlock = system.getBlock(tickingArea,bPosition.x,bPosition.y,bPosition.z).__identifier__;
        if(unusualBlockList.indexOf(placeBlock) != -1){
            //放置了不该有的方块
            system.executeCommand(`execute @a[name="${playerName}"] ~ ~ ~ fill ${bPosition.x} ${bPosition.y} ${bPosition.z} ${bPosition.x} ${bPosition.y} ${bPosition.z} air 0 replace`,data=>{});
            
            system.sendText(player,`你哪来的方块？`);
            system.executeCommand(`tellraw @a {"rawtext":[{"text":"§c大家小心,${playerName}放置了${placeBlock}"}]}`,data=>{});
            playerKicked.push(player);
            kickTickReset();
            
            server.log(`${playerName}异常放置${placeBlock}`);
            db.update(INSERT_MISB,{
                $time:getTime(),
                $name:playerName,
                $position:`${bPosition.x} ${bPosition.y} ${bPosition.z}`,
                $behavior:`放置异常物品`,
                $description:placeBlock,
                $extra:"",
                $dim:getDimensionOfEntity(player),
                $timestamp:date.getTime()
            });
            //依赖EasyList
            let datas = db.query(QUERY_MISB_BYNAME,{$name:playerName});
            if (datas.length > 3){
                system.executeCommand(`tellraw @a {"rawtext":[{"text":"§c${playerName}被记录的异常行为超过3次，予以封禁"}]}`,data=>{});
                system.executeCommand(`fban ${playerName} misbehaviour-place`,data=>{});
            }
        }
    }
});



system.listenForEvent("minecraft:entity_carried_item_changed",data=>{
    try{
    let entity = data.data.entity;
    if(entity){
    let item = data.data.carried_item;
    if(entity.__identifier__ == "minecraft:player"){
        if(!checkAdmin(entity)){
            if(unusualBlockList.indexOf(item.__identifier__) != -1){
                let playerName = getName(entity);
                system.sendText(entity,`你持有违禁品`);
                system.executeCommand(`tellraw @a {"rawtext":[{"text":"§c${playerName}不知道从哪里拿出了违禁品:${item.__identifier__}"}]}`,data=>{});
                system.executeCommand(`clear @a[name="${playerName}"] ${item.__identifier__.split(":")[1]} 0 1000`,data=>{});
                playerKicked.push(entity);
                kickTickReset();
                server.log(`${playerName}持有违禁品${item.__identifier__}`);
                db.update(INSERT_MISB,{
                    $time:getTime(),
                    $name:playerName,
                    $position:"",
                    $behavior:`持有违禁品`,
                    $description:`${item.__identifier__}`,
                    $extra:"",
                    $dim:getDimensionOfEntity(entity),
                    $timestamp:date.getTime()
                });
                //依赖EasyList
                let datas = db.query(QUERY_MISB_BYNAME,{$name:playerName});
                if (datas.length > 3){
                    system.executeCommand(`tellraw @a {"rawtext":[{"text":"§c${playerName}被记录的异常行为超过3次，予以封禁"}]}`,data=>{});
                    system.executeCommand(`fban ${playerName} misbehaviour-have`,data=>{});
                }
            }
        }
    }
}
}catch (err){
    server.log("出现错误");
}
});



//防刷
system.listenForEvent("minecraft:block_interacted_with",data=>{
    let player = data.data.player;
    try {
        let bPosition = data.data.block_position;
        let tickAreaCmp = system.getComponent<ITickWorldComponent>(player,MinecraftComponent.TickWorld);
        let tickingArea = tickAreaCmp.data.ticking_area;
        let interactBlock = system.getBlock(tickingArea,bPosition.x,bPosition.y,bPosition.z).__identifier__;
        if(interactBlock == "minecraft:crafting_table"){
            let comp = system.getComponent<IUseCraftTableComponent>(player,"misbehavior:useCraftTable");
            comp.data.ifUse = true;
            system.applyComponentChanges(player,comp);
            system.sendText(player,"打开工作台后进入无法拾取的状态，请右键（手机点击）其他方块解除状态");
        }
        else{
            let comp = system.getComponent<IUseCraftTableComponent>(player,"misbehavior:useCraftTable");
            if(comp.data.ifUse == true){
            system.sendText(player,`解除无法拾取物品的状态`);
            comp.data.ifUse = false;
            comp.data.ifShow = false;
            system.applyComponentChanges(player,comp);
            }
        }
    } catch (error) {
        
    }

});

//使用工作台的时候无法捡起物品

system.handlePolicy(MinecraftPolicy.EntityPickItemUp,(data,def)=>{
    let player = data.entity;
    try {
        if(player.__identifier__ == "minecraft:player"){
            let comp = system.getComponent<IUseCraftTableComponent>(player,"misbehavior:useCraftTable");
                if(comp.data.ifUse == true){
                    if(comp.data.ifShow == false){
                        system.sendText(player,`请右键任意方块解除无法拾取的状态`);
                        comp.data.ifShow = true;
                        system.applyComponentChanges(player,comp);
                    }
                    return false;
                }
                else{
                    return true;
                }
        }
            else{
                return true;
            }
    } catch (error) {
        return true;
    }
});

    

    playerQuery = system.registerQuery();
    system.addFilterToQuery(playerQuery,"misbehavior:isplayer");
    system.listenForEvent("minecraft:piston_moved_block",data=>{
        try {
            let pPosition = data.data.piston_position;
            let bPosition = data.data.block_position;
            let players = system.getEntitiesFromQuery(playerQuery);
            let suspect;
            //首先利用
            for (let player of players){
                let px,py,pz;
                let comp = system.getComponent<IPositionComponent>(player,MinecraftComponent.Position);
                px = comp.data.x;
                py = comp.data.y;
                pz = comp.data.z;
                //server.log(`共找到${players.length}个在线玩家`);
                if(px >= (pPosition.x-10) && px <= (pPosition.x+10) && py >= (pPosition.y-10) && py <= (pPosition.y+10) && pz >= (pPosition.z-10) && pz <= (pPosition.z+10)){
                    //此人为嫌疑人
                    let tickAreaCmp = system.getComponent<ITickWorldComponent>(player,MinecraftComponent.TickWorld);
                    let tickingArea = tickAreaCmp.data.ticking_area;
                    let playerName = getName(player);
                    let pushBlock = system.getBlock(tickingArea,bPosition.x,bPosition.y,bPosition.z).__identifier__;
                    if(cannotPushContainerList.indexOf(pushBlock) != -1){
                        system.executeCommand(`execute @a[name="${playerName}"] ~ ~ ~ fill ${bPosition.x} ${bPosition.y} ${bPosition.z} ${bPosition.x} ${bPosition.y} ${bPosition.z} air 0 replace`,data=>{});
                        system.sendText(player,`你想做什么？`);
                        server.log(`玩家${playerName}有刷物品嫌疑`);
                        db.update(INSERT_MISB,{
                            $time:getTime(),
                            $name:playerName,
                            $position:`${bPosition.x} ${bPosition.y} ${bPosition.z}`,
                            $behavior:`刷物品嫌疑`,
                            $description:`推动容器${pushBlock}`,
                            $extra:"",
                            $dim:getDimensionOfEntity(player),
                            $timestamp:date.getTime()
                        });
                        system.executeCommand(`tellraw @a {"rawtext":[{"text":"§c${playerName}有刷物品的嫌疑"}]}`,data=>{});

                        let datas = db.query(QUERY_MISB_BYNAME,{$name:playerName});
                        if (datas.length > 3){
                            system.executeCommand(`tellraw @a {"rawtext":[{"text":"§c${playerName}被记录的异常行为超过3次，予以封禁"}]}`,data=>{});
                            system.executeCommand(`fban ${playerName} misbehaviour-push`,data=>{});
                        }
                    }
                    else{
    
                    }
                }
            }
        } catch (error) {
            
        }

    });


    //查询命令
    system.registerCommand("misblog",{
        description:"查看不当行为记录",
        permission:1,
        overloads:[{
          parameters:[],
          handler([]){
            let datas = Array.from(db.query(QUERY_ALL_MISB,{}));
            let show = "";
            for (let index in datas){
                let data = datas[index];
                show += `<${index}>${data.time} ${data.name} ${data.behavior} ${data.description}\n`;
            }
            return show;
        }
        } as CommandOverload<[]>
      ]
      });
}
# BehaviourLogs 玩家行为日志插件
此插件旨在记录玩家在游戏中诸如破坏/放置/打开容器等行为，在遭到他人恶意破坏之后能查到“凶手”。目前支持版本 StoneServer 1.12.
## 使用方法
**请使用最新版stoneserver（可以先运行一次bash install.sh重新下载来更新） 插件文件为BehaviourLog.tgz**
1. 在游戏中输入 /logs 即会出现命令提示
   
   命令结构如下
   
   [![eloCKs.md.png](https://s2.ax1x.com/2019/07/28/eloCKs.md.png)](https://imgchr.com/i/eloCKs)
   
   /logs 起点坐标 终点坐标 *行为名*（all/break/place/open/use） *几小时内* *玩家名*   
   **斜体皆为可选参数**
   
   查询效果如下:
   
   [![eloMrR.md.png](https://s2.ax1x.com/2019/07/28/eloMrR.md.png)](https://imgchr.com/i/eloMrR)
   [![elo3a6.md.png](https://s2.ax1x.com/2019/07/28/elo3a6.md.png)](https://imgchr.com/i/elo3a6)

   目前支持查询
   - place 玩家放置方块查询
   - break 玩家破坏方块查询
   - open 玩家打开容器查询





   - use 玩家使用物品查询（包括使用桶/打火石等

2. /dellogs n
   
   由于玩家行为较多，数据数量增长较快，为了更好的浏览请定期删除过期记录，此命令用于n天之前的所有记录。

3. /bhundo 
   
   撤销指定范围内，制定玩家几天内的破坏/放置记录（由于没有记录方块数据值 这个还原不是100%准确）
   示例：/bhundo 3 haojie06 ~-10 ~-10 ~-10 ~+10 ~+10 ~+10 

**已知BUG 行为日志无法记录 方块被破坏但是不生成掉落物的情况（比如用手破坏石砖） 这点请注意**
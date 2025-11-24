/// <reference path="../neobot.d.ts" />

generalConfig.addOption("whitelist.enable", true)
generalConfig.addOption("whitelist.need-bind-to-login", true)
generalConfig.addOption("whitelist.max-bind-count", 1)
generalConfig.addOption("whitelist.prefix.bind", ["绑定 ", "bind ", "/绑定 ", "/bind "])
generalConfig.addOption("whitelist.prefix.unbind", ["解绑 ", "unbind ", "/解绑 ", "/unbind "])
generalConfig.addOption("whitelist.unbind-on-leaving", true)
generalConfig.addOption("whitelist.change-nickname-on-bind.enable", false)
generalConfig.addOption("whitelist.change-nickname-on-bind.format", "${playerName}")
generalConfig.addOption("whitelist.admin.bypass-permission", "neobot.whitelist.bypass")
generalConfig.addOption("whitelist.admin.bind.enable", false)
generalConfig.addOption("whitelist.admin.bind.prefix", ["强制绑定 ", "/forcebind ", "/abind "])
generalConfig.addOption("whitelist.admin.unbind.enable", false)
generalConfig.addOption("whitelist.admin.unbind.prefix", ["强制解绑 ", "/forceunbind ", "/aunbind "])
generalConfig.addOption("whitelist.cooldown.bind", 60)
generalConfig.addOption("whitelist.cooldown.unbind", 86400)

messageConfig.addOption("whitelist.unbind", "你还没有绑定账号!\n请先加入QQ群: 114514\n通过 /绑定 你的游戏名 来绑定账号")
messageConfig.addOption("whitelist.player-already-bind", "该名称已被绑定")
messageConfig.addOption("whitelist.bind-too-many", "你不能再绑定更多账户!")
messageConfig.addOption("whitelist.bind-success", "绑定成功")
messageConfig.addOption("whitelist.unbind-success", "解绑成功")
messageConfig.addOption("whitelist.player-didnt-bind", "该名称未被你绑定过")
messageConfig.addOption("whitelist.in-cooldown", "该操作还在冷却中 (${time} 秒)!")
messageConfig.addOption("whitelist.error", "执行操作时出现了错误: ${error}")

const table = plugin.getStorageProvider().getStorage().table("neobot_whitelist")
table.create()
  .column("qq", "BIGINT", "PRIMARY KEY")
  .column("players", "TEXT", "NOT NULL")
  .execute()

const logTable = plugin.getStorageProvider().getStorage().table("neobot_whitelist_logs")
logTable.create()
  .column("time", "BIGINT", "PRIMARY KEY")
  .column("operator", "BIGINT", "NOT NULL")
  .column("target", "BIGINT", "NOT NULL")
  .column("player", "BIGINT", "NOT NULL")
  .column("action", "TEXT", "NOT NULL")
  .execute()

gameEvent.register("LoginEvent", (event) => {
  if (!generalConfig.getBoolean("whitelist.enable") || !generalConfig.getBoolean("whitelist.need-bind-to-login")) return
  let hasBind = false
  const rows = table.select(["players", "qq"]).execute().map()
  for (const row of rows) {
    let players = JSON.parse(row.getString("players"))
    for (const player of players) {
      if (player === event.getName()) hasBind = true
    }
  }
  if (!hasBind) {
    event.disallow(messageConfig.getString("whitelist.unbind"))
  }
})

qq.register("GroupMessageEvent", (event) => {
  if (!generalConfig.getBoolean("whitelist.enable")) return
  const jsonMessage = event.getJsonMessage()
  let newMessage = scriptManager.callJsMethod("util.parseTextJsonMessage", jsonMessage)
  if (newMessage === undefined) return
  for (const prefix of generalConfig.getStringArray("whitelist.prefix.bind")) {
    if (newMessage.startsWith(prefix)) {
      scriptManager.callJsMethod("util.addNoForward", event.getMessageId())
      bind(event.getGroupId(), event.getSenderId(), newMessage.substring(prefix.length))
    }
  }
  for (const prefix of generalConfig.getStringArray("whitelist.prefix.unbind")) {
    if (newMessage.startsWith(prefix)) {
      scriptManager.callJsMethod("util.addNoForward", event.getMessageId())
      unbind(event.getGroupId(), event.getSenderId(), newMessage.substring(prefix.length))
    }
  }
  if (generalConfig.getBoolean("whitelist.admin.bind.enable")) {
    for (const prefix of generalConfig.getStringArray("whitelist.admin.bind.prefix")) {
      if (newMessage.startsWith(prefix)) {
        scriptManager.callJsMethod("util.addNoForward", event.getMessageId())
        try {
          adminBind(event.getGroupId(), event.getSenderId(), newMessage.split(" ")[1], newMessage.split(" ")[2])
        } catch (e) {
          scriptManager.callJsMethod("util.sendGroupTextMessage", event.getGroupId(), messageConfig.getString("whitelist.error")
            .replaceAll("${error}", e))
        }
      }
    }
  }
  if (generalConfig.getBoolean("whitelist.admin.unbind.enable")) {
    for (const prefix of generalConfig.getStringArray("whitelist.admin.unbind.prefix")) {
      if (newMessage.startsWith(prefix)) {
        scriptManager.callJsMethod("util.addNoForward", event.getMessageId())
        try {
          if (newMessage.split(" ").length === 2) {
            adminUnbind(event.getGroupId(), event.getSenderId(), newMessage.split(" ")[1])
          } else {
            adminUnbind(event.getGroupId(), event.getSenderId(), newMessage.split(" ")[1], newMessage.split(" ")[2])
          }
        } catch (e) {
          scriptManager.callJsMethod("util.sendGroupTextMessage", event.getGroupId(), messageConfig.getString("whitelist.error")
            .replaceAll("${error}", e))
        }
      }
    }
  }

})

function adminBind(groupId, operatorId, qqId, playerName) {
  let count = 0
  const result = table.select(["players", "qq"]).where("qq", qqId).execute()
  for (const row of result.map()) {
    let qqNumber = row.getLong("qq")
    let players = JSON.parse(row.getString("players"))
    if (qqId === qqNumber) {
      count += players.length
    }
    if (count >= generalConfig.getInt("whitelist.max-bind-count")) {
      scriptManager.callJsMethod("util.sendGroupTextMessage", groupId, messageConfig.getString("whitelist.bind-too-many"))
      return
    }
    let remove = false
    for (const player of players) {
      if (player === playerName) {
        remove = true
        break
      }
    }
    if (remove) {
      players = players.filter((player) => player !== playerName)
      table.update().set("players", "'" + JSON.stringify(players) + "'").where("qq", qqId).execute()
    }
  }
  let playerResult = table.select("players").where("qq", qqId).execute()
  try {
    let playerData = JSON.parse(playerResult.getFirst().getString("players"))
    playerData.push(playerName)
    table.update().set("players", "'" + JSON.stringify(playerData) + "'").where("qq", qqId).execute()
  } catch (ignored) {
    let playerData = [playerName]
    table.insert().column("qq", qqId).column("players", "'" + JSON.stringify(playerData) + "'").execute()
  }
  logTable.insert().column("time", Date.now())
    .column("operator", operatorId)
    .column("target", qqId)
    .column("player", playerName)
    .column("action", "'ADMIN_BIND'")
    .execute()
  scriptManager.callJsMethod("util.sendGroupTextMessage", groupId, messageConfig.getString("whitelist.bind-success")
    .replaceAll("${player}", playerName))
}

function bind(groupId, qqId, playerName) {
  const logResult = logTable.select(["time", "operator", "action"]).where("operator", qqId).execute()
  for (const log of logResult.map()) {
    if (log.getString("action") === "BIND" && Date.now() - log.getLong("time") < generalConfig.getInt("whitelist.cooldown.bind") * 1000) {
      scriptManager.callJsMethod("util.sendGroupTextMessage", groupId, messageConfig.getString("whitelist.in-cooldown")
        .replaceAll("${time}", generalConfig.getInt("whitelist.cooldown.bind") -
          Math.floor((Date.now() - log.getLong("time")) / 1000)))
      return
    }
  }
  let count = 0
  const result = table.select(["players", "qq"]).where("qq", qqId).execute()
  for (const row of result.map()) {
    let qqNumber = row.getLong("qq")
    let players = JSON.parse(row.getString("players"))
    if (qqId === qqNumber) {
      count += players.length
    }
    if (count >= generalConfig.getInt("whitelist.max-bind-count")) {
      scriptManager.callJsMethod("util.sendGroupTextMessage", groupId, messageConfig.getString("whitelist.bind-too-many"))
      return
    }
    for (const player of players) {
      if (player === playerName) {
        scriptManager.callJsMethod("util.sendGroupTextMessage", groupId, messageConfig.getString("whitelist.player-already-bind"))
        return
      }
    }
  }
  let playerResult = table.select("players").where("qq", qqId).execute()
  try {
    let playerData = JSON.parse(playerResult.getFirst().getString("players"))
    playerData.push(playerName)
    table.update().set("players", "'" + JSON.stringify(playerData) + "'").where("qq", qqId).execute()
  } catch (ignored) {
    let playerData = [playerName]
    table.insert().column("qq", qqId).column("players", "'" + JSON.stringify(playerData) + "'").execute()
  }
  logTable.insert().column("time", Date.now())
    .column("operator", qqId)
    .column("target", qqId)
    .column("player", playerName)
    .column("action", "'BIND'")
    .execute()
  scriptManager.callJsMethod("util.sendGroupTextMessage", groupId, messageConfig.getString("whitelist.bind-success")
    .replaceAll("${player}", playerName))
  if (generalConfig.getBoolean("whitelist.change-nickname-on-bind.enable")) {
    let format = generalConfig.getString("whitelist.change-nickname-on-bind.format")
      .replaceAll("${playerName}", playerName)
    qq.renameGroupMember(groupId, qqId, format)
  }
}

function adminUnbind(groupId, operatorId, qqId, playerName = "ALL") {
  if (playerName === "ALL") {
    table.update().set("players", "'[]'").where("qq", qqId).execute()
    logTable.insert().column("time", Date.now())
      .column("operator", operatorId)
      .column("target", qqId)
      .column("player", "ALL")
      .column("action", "'ADMIN_BIND'")
      .execute()
    scriptManager.callJsMethod("util.sendGroupTextMessage", groupId, messageConfig.getString("whitelist.unbind-success"))
  } else {
    let playerResult = table.select("players").where("qq", qqId).execute()
    for (const row of playerResult.map()) {
      let playerData = JSON.parse(row.getString("players"))
      if (playerData.includes(playerName)) {
        playerData.splice(playerData.indexOf(playerName), 1)
        table.update().set("players", "'" + JSON.stringify(playerData) + "'").where("qq", qqId).execute()
        logTable.insert().column("time", Date.now())
          .column("operator", operatorId)
          .column("target", qqId)
          .column("player", playerName)
          .column("action", "'ADMIN_UNBIND'")
          .execute()
        scriptManager.callJsMethod("util.sendGroupTextMessage", groupId, messageConfig.getString("whitelist.unbind-success"))
        return
      }
    }
    scriptManager.callJsMethod("util.sendGroupTextMessage", groupId, messageConfig.getString("whitelist.player-didnt-bind"))
  }
}


function unbind(groupId, qqId, playerName) {
  const logResult = logTable.select(["time", "operator", "action"]).where("operator", qqId).execute()
  for (const log of logResult.map()) {
    if (log.getString("action") === "UNBIND" && Date.now() - log.getLong("time") < generalConfig.getInt("whitelist.cooldown.unbind") * 1000) {
      scriptManager.callJsMethod("util.sendGroupTextMessage", groupId, messageConfig.getString("whitelist.in-cooldown")
        .replaceAll("${time}", generalConfig.getInt("whitelist.cooldown.unbind") -
          Math.floor((Date.now() - log.getLong("time")) / 1000)))
      return
    }
  }
  let playerResult = table.select("players").where("qq", qqId).execute()
  for (const row of playerResult.map()) {
    let playerData = JSON.parse(row.getString("players"))
    if (playerData.includes(playerName)) {
      playerData.splice(playerData.indexOf(playerName), 1)
      table.update().set("players", "'" + JSON.stringify(playerData) + "'").where("qq", qqId).execute()
      logTable.insert().column("time", Date.now())
        .column("operator", qqId)
        .column("target", qqId)
        .column("player", playerName)
        .column("action", "'UNBIND'")
        .execute()
      scriptManager.callJsMethod("util.sendGroupTextMessage", groupId, messageConfig.getString("whitelist.unbind-success"))
      return
    }
  }
  scriptManager.callJsMethod("util.sendGroupTextMessage", groupId, messageConfig.getString("whitelist.player-didnt-bind"))
}

scriptManager.addJsMethod("queryBinds", (userId) => {
  return JSON.parse(table.select(["players"]).where("qq", userId).execute().getFirst().getString("players"))
})
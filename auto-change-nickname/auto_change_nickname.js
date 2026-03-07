generalConfig.addOption("auto-change-nickname.enable", false)
generalConfig.addOption("auto-change-nickname.format", "${playerName}")

function change() {
    const table = scriptManager.callJsMethod("whitelist.getTable")
    const rows = table.select(["players", "qq"]).execute().map()
    for (const row of rows) {
        let players = JSON.parse(row.getString("players"))
        if (players.length > 0) {
            let player = players[0]
            for (const groupId of generalConfig.getNumberArray("bot.options.enable-groups")) {
                qq.renameGroupMember(groupId, row.getLong("qq"), generalConfig.getString("auto-change-nickname.format").replaceAll("${playerName}", player))
            }
        }
    }
}

plugin.getScriptScheduler().submitAsync("auto-change-nickname", "change", 0, 60)
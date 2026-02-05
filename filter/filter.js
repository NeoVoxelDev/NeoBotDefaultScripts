/// <reference path="../neobot.d.ts" />

messageConfig.addOption("filter.fetching-from-url", "正在从 ${url} 获取过滤词信息...")
messageConfig.addOption("filter.failed-to-fetch", "无法从 ${url} 获取过滤词信息: ${message}")

generalConfig.addOption("filter.rules", [])

class Rule {
    filter(message) {
        return message
    }
}

class ContentRule extends Rule {
    constructor(content, to) {
        super();
        this.content = content;
        this.to = to;
    }

    filter(message) {
        return message.replaceAll(this.content, this.to)
    }
}

class RegexRule extends Rule {
    constructor(regex, to) {
        super();
        this.regex = new RegExp(regex);
        this.to = to;
    }

    filter(message) {
        return message.replaceAll(this.regex, this.to)
    }
}

class RemoteRule extends Rule {
    constructor(url, path, to) {
        super();
        this.url = url;
        this.path = path;
        this.to = to;
    }

    async fetch() {
        plugin.getNeoLogger().info(messageConfig.getString("filter.fetching-from-url").replaceAll("${url}", this.url))
        let resp = await fetch(this.url)
        if (resp.status !== 200) {
            plugin.getNeoLogger().error(messageConfig.getString("filter.failed-to-fetch")
                .replaceAll("${url}", this.url)
                .replaceAll("${message}", resp.statusText))
            return
        }
        const data = await resp.json()
        this.contents = data[this.path]
    }

    filter(message) {
        if (this.contents == null) {
            return message
        }
        for (const content of this.contents) {
            message = message.replaceAll(content, this.to)
        }
        return message
    }
}

function match(str) {
    const pattern = /\$([^:]+):\{([^}]+)\}/;

    const match = str.match(pattern);

    if (match) {
        const [, key, value] = match;
        return [key, value];
    }
}

const rules = []

generalConfig.getStringArray("filter.rules").forEach((rule) => {
    const conditions = rule.split(" ")
    const map = new Map()
    conditions.forEach((condition) => {
        const [key, value] = match(condition)
        if (key != null && value != null) {
            map[key] = value
        }
    })
    if (map.has("filter")) {
        rules.push(new ContentRule(map.get("filter"), map.get("replaceTo")))
    }
    if (map.has("regex")) {
        rules.push(new RegexRule(map.get("regex"), map.get("replaceTo")))
    }
    if (map.has("url")) {
        rules.push(new RemoteRule(map.get("url"), map.get("path"), map.get("replaceTo")))
    }
})

function filter(message) {
    for (const rule of rules) {
        message = rule.filter(message)
    }
    return message
}


scriptManager.addJsMethod("filter.filterMessage", filter)
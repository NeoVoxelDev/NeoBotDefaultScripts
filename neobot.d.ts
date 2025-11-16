declare interface QQEvent {
    getSelfId(): number
    getTime(): number
}

declare interface GroupMessageEvent extends QQEvent {
    getGroupId(): number
    getMessageId(): number
    getSenderId(): number
    getRawMessage(): string
    getJsonMessage(): string
}

declare interface GroupMessageEvent extends QQEvent {
    getMessageId(): number
    getSenderId(): number
    getRawMessage(): string
}

declare interface FriendAddEvent extends QQEvent {
    getUserId(): number
}

declare interface GroupDecreaseEvent extends QQEvent {
    getUserId(): number
    getOperatorId(): number
    getGroupId(): number
}

declare interface GroupIncreaseEvent extends QQEvent {
    getUserId(): number
    getOperatorId(): number
    getGroupId(): number
}

declare interface PokeEvent extends QQEvent {
    getUserId(): number
    getGroupId(): number
    getTargetId(): number
}

declare interface FriendRequestEvent extends QQEvent {
    getUserId(): number
    getComment(): string
    getFlag(): string
}

declare interface GroupRequestEvent extends QQEvent {
    getUserId(): number
    getGroupId(): number
    getComment(): string
    getFlag(): string
}

declare interface BasicInfo {
    getUserId(): number
    getNickname(): string
}

declare interface GroupMemberInfo {
    getGroupId(): number
    getUserId(): number
    getNickname(): string
    getCard(): string
    getAge(): number
    getArea(): string
    getJoinTime(): number
    getLastSentTime(): number
    getLevel(): string
    getTitle(): string
    getTitleExpireTime(): number
    getCardChangeable(): boolean
}

declare interface QQ {
    register(eventName: string, callback: (arg: QQEvent) => void): void
    sendGroupMessage(groupId: number, message: string): void
    sendPrivateMessage(userId: number, message: string): void
    renameGroupMember(groupId: number, userId: number, newName: string): void
    muteGroupMember(groupId: number, userId: number, duration: number): void
    muteAllGroupMember(groupId: number): void
    unMuteAllGroupMember(groupId: number): void
    kickGroupMember(groupId: number, userId: number): void
    approveGroupRequest(flag: string, type: string): void
    rejectGroupRequest(flag: string, type: string): void
    rejectFriendRequest(flag: string): void
    approveFriendRequest(flag: string): void
    getGroupMemberList(groupId: number, callback: (arg: BasicInfo[]) => void): void
    getGroupMemberInfo(groupId: number, userId: number, callback: (arg: GroupMemberInfo) => void): void
}

declare const qq: QQ

declare interface LoginEvent {
    getName(): string
    disallow(reason: string): void
}

declare interface JoinEvent extends Player {}

declare interface QuitEvent extends Player {}

declare interface ChatEvent {
    getPlayer(): Player
    getMessage(): string
    disallow(): void
}

declare interface Player {
    getName(): string
    sendMessage(message: string): void
    kick(message: string): void
}

declare interface Game {
    register(eventName: string, callback: (arg: any[]) => void): void;
}

declare const gameEvent: Game

declare interface CommandSender {
    getName(): string
    sendMessage(message: string): void
    hasPermission(permission: string): boolean
}

declare interface GameCommand {
    onCommand(callback: (sender: CommandSender, args: string[]) => void): void;
}

declare const gameCommand: GameCommand

declare interface Config {
    getString(node: string): string
    getDouble(node: string): number
    getInt(node: string): number
    getBoolean(node: string): boolean
    has(node: string): boolean
    put(node: string, value: any): void // 该方法并不将 put 的对象持久化
    getKeys(): string[]
    getObject(node: string): Config
    getArray(node: string): Config[]
    getStringArray(node: string): string[]
    getNumberArray(node: string): number[]
    getMessage(node: string): string
    addOption(node: string, defaultValue: any): void
}

declare const generalConfig: Config

declare const messageConfig: Config

declare interface Logger {
    info(message: string): void
    warn(message: string): void
    error(message: string): void
    debug(message: string): void
    trace(message: string): void
}

declare interface DatabaseCreator {
    column(name: string, type: string, extraOptions: string): DatabaseCreator
    execute(): void
}

declare interface Row {
    getString(column: string): string
    getInt(column: string): number
    getLong(column: string): number
    getFloat(column: string): number
    getDouble(column: string): number
    getBoolean(column: string): boolean
    getObject(column: string): any
    getObject<T>(column: string, type: T): T
}

declare interface Result {
    map(): Row[]
    getFirst(): Row
    get(index: number): Row
}

declare interface DatabaseSelector {
    all(): DatabaseSelector
    column(column: string): DatabaseSelector
    column(column: string[]): DatabaseSelector
    where(column: string, value: any): DatabaseSelector
    where(column: string, operator: string, value: any): DatabaseSelector
    execute(): Result
}

declare interface DatabaseUpdater {
    set(column: string, value: any): DatabaseUpdater
    where(column: string, value: any): DatabaseUpdater
    where(column: string, operator: string, value: any): DatabaseUpdater
    execute(): void
}

declare interface DatabaseInserter {
    column(column: string, value: any): DatabaseInserter
    execute(): void
}

declare interface DatabaseModifier {
    add(name: string, type: string): DatabaseModifier
    add(name: string, type: string, extraOptions: string): DatabaseModifier
    remove(name: string): DatabaseModifier
    execute(): void
}

declare interface DatabaseTable {
    delete(): void
    select(columns: string[]): DatabaseSelector
    create(): DatabaseCreator
    update(): DatabaseUpdater
    insert(): DatabaseInserter
    alter(): DatabaseModifier
}

declare interface DatabaseStorage {
    table(name: string): DatabaseTable
}

declare interface Player extends OfflinePlayer {
    sendMessage(message: string): void
    hasPermission(permission: string): boolean
    kick(message: string): void
}

declare interface OfflinePlayer {
    getName(): string
    isOnline(): boolean
}

declare interface ScriptManager {
    loadParser(parser: (arg: string) => string): void
    parse(content: string): string
    addJsMethod(name: string, method: (arg: any[]) => any): void
    hasJsMethod(name: string): boolean
    callJsMethod(name: string, args: any[]): any
}

declare const scriptManager: ScriptManager

declare interface NeoBot {
    getNeoLogger(): Logger
    getStorage(): DatabaseStorage
    getStorageType(): string
    broadcast(message: string): void;
    getOnlinePlayers(): Player[]
    getOnlinePlayer(name: string): Player
    getOfflinePlayer(name: string): OfflinePlayer
    parsePlaceholder(message: string, player: Player): string
}

declare const plugin: NeoBot
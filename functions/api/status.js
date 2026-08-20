import { json, modelName } from "./_shared.js";

export const onRequestGet = () => json({ app: "wuthering-waves-duel", available: true, model: modelName(), keyPersistence: "browser-session" });

import { registerRootComponent } from "expo";
import App from "./App";
// Define la tarea de segundo plano del aviso diario antes de montar la app
import "./lib/daily-notification";

registerRootComponent(App);

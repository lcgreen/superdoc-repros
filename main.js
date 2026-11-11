// A bare SuperDoc mount: no extensions, no custom UI, default modules.
import { SuperDoc } from "superdoc";
import "superdoc/style.css";

const params = new URLSearchParams(location.search);
const name = params.get("doc") ?? "deleted-field";
const blob = await (await fetch(`/docs/${name}.docx`)).blob();
const file = new File([blob], `${name}.docx`, {
  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
});

window.exceptions = [];
window.ready = false;
window.sd = new SuperDoc({
  selector: "#editor",
  document: file,
  documentMode: params.get("mode") ?? "suggesting",
  user: { name: "Repro", email: "repro@example.com" },
  telemetry: { enabled: false },
  onReady: () => {
    window.ready = true;
  },
  onException: (payload) => {
    const line = `${payload?.internalCode ?? payload?.code}: ${payload?.error?.message ?? payload?.message}`;
    window.exceptions.push(line);
    document.querySelector("#log").textContent = window.exceptions.join("\n");
  },
});

// CSS injection shim for esbuild
import inserted from './src/shared-mermaid/diagramStyles.css';

const style = document.createElement('style');
style.textContent = inserted;
document.head.appendChild(style);

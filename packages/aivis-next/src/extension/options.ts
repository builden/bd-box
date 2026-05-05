const statusTitle = document.getElementById('status-title');
const statusText = document.getElementById('status-text');
const noteTitle = document.getElementById('note-title');
const noteText = document.getElementById('note-text');

if (statusTitle && statusText && noteTitle && noteText) {
  statusTitle.textContent = '当前版本使用站点级开关';
  statusText.textContent = 'Aivis Next 不再使用全局默认启用；请在浏览器工具栏的 popup 中为当前站点单独开启。';
  noteTitle.textContent = '启动方式';
  noteText.textContent = '打开一个普通网页，点击工具栏里的 Aivis Next 图标，在 popup 里切换当前站点状态。';
}

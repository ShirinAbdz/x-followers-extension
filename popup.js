const $ = id => document.getElementById(id);
const fields = ['maxFollowers', 'maxUnfollows', 'minDelay', 'maxDelay', 'whitelist'];

chrome.storage.local.get(fields, saved => {
  fields.forEach(f => { if (saved[f] !== undefined) $(f).value = saved[f]; });
});

function getSettings() {
  const s = {
    maxFollowers: Number($('maxFollowers').value) || 1000,
    maxUnfollows: Number($('maxUnfollows').value) || 40,
    minDelay: Number($('minDelay').value) || 5,
    maxDelay: Number($('maxDelay').value) || 12,
    whitelist: $('whitelist').value
  };
  if (s.maxDelay < s.minDelay) s.maxDelay = s.minDelay + 1;
  chrome.storage.local.set(s);
  return s;
}

function log(t) {
  const el = $('log');
  el.textContent += t + '\n';
  el.scrollTop = el.scrollHeight;
}

async function send(msg) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !/^https:\/\/(x|twitter)\.com\//.test(tab.url || '')) {
    log('❌ اول تب x.com رو باز کن.');
    return;
  }
  try {
    await chrome.tabs.sendMessage(tab.id, msg);
  } catch (e) {
    log('❌ صفحه رو رفرش کن و دوباره امتحان کن.');
  }
}

$('start').onclick = () => send({ type: 'start', settings: getSettings() });
$('stop').onclick = () => send({ type: 'stop' });

chrome.runtime.onMessage.addListener(m => {
  if (m.type === 'log') log(m.text);
  if (m.type === 'stat') $('stat').textContent = m.text;
});

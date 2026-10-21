const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'about.html', 'ai-decisioning-studio.html', 'streams.html', 'ai-champion.html'];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('every published About view uses about_1, the same CV summary, and a download as its only CV action', () => {
    const summaries = new Set();
    for (const page of pages) {
        const html = read(page);
        assert.match(html, /class="about-video" src="\.\/homePage\/aboutVideo-framed\.mp4"/);
        assert.ok(!html.includes('homePage/about_video'), page + ' still loads the replacement video or poster');
        const summary = html.match(/<p class="about-block-label">About<\/p>\s*<p class="about-block-text">([^<]+)<\/p>/)[1];
        assert.match(summary, /10\+ years across B2B and B2C products/);
        assert.match(summary, /AI decisioning, agentic and conversational experiences/);
        summaries.add(summary);
        assert.ok(!/href="\.\/assets\/documents\/Sasha-Maiboroda-CV\.pdf" target="_blank"/.test(html), page + ' still has an Open CV link');
        assert.match(html, /href="\.\/assets\/documents\/Sasha-Maiboroda-CV\.pdf" download="Sasha-Maiboroda-CV\.pdf" data-no-transition/);
    }
    assert.equal(summaries.size, 1);
});
test('the About video and the original PDF are published', async () => {
    assert.ok(fs.existsSync(path.join(root, 'homePage/aboutVideo-framed.mp4')));
    assert.equal(fs.readFileSync(path.join(root, 'assets/documents/Sasha-Maiboroda-CV.pdf')).subarray(0, 5).toString(), '%PDF-');
    const config = await import(pathToFileURL(path.join(root, 'portfolio.config.mjs')).href);
    assert.ok(config.runtimeAssets.includes('homePage/aboutVideo-framed.mp4'));
    assert.ok(config.runtimeAssets.includes('assets/documents/Sasha-Maiboroda-CV.pdf'));
    assert.ok(!config.runtimeAssets.includes('homePage/about_video.mp4'));
    assert.ok(!config.runtimeAssets.includes('homePage/about_video-poster.jpg'));
});
test('CV open and download links bypass page-transition navigation', () => {
    let click;
    const document = {
        referrer: '',
        querySelector: () => ({}),
        documentElement: { style: { getPropertyValue: () => '' }, classList: { contains: () => false } },
        addEventListener(name, handler) { if (name === 'click') click = handler; },
    };
    const window = { addEventListener() {} };
    vm.runInNewContext(read('js/transitionFade.js'), {
        window, document, location: { pathname: '/index.html', origin: 'http://localhost' },
        sessionStorage: { getItem: () => null, setItem() {} }, URL,
        setTimeout() { assert.fail('A CV action triggered page navigation'); }, clearTimeout() {},
    });
    for (const action of ['open', 'download']) {
        let prevented = false;
        const link = { target: action === 'open' ? '_blank' : '', hasAttribute: name => action === 'download' && name === 'download', getAttribute: () => './assets/documents/Sasha-Maiboroda-CV.pdf' };
        click({ defaultPrevented: false, target: { closest: () => link }, preventDefault() { prevented = true; } });
        assert.equal(prevented, false, action + ' action was intercepted');
    }
});

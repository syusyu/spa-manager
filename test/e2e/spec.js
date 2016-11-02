
describe('Test style.js', function() {
    it('should have a title', function() {
        // browser.get('http://juliemr.github.io/protractor-demo/');
        // browser.get('file:///Users/hisa/development/work-git/design-template/src/index.html');
        browser.get('');

        expect(browser.getTitle()).toEqual('Design trial');
    });
});
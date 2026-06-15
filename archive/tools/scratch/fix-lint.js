const fs = require('fs');

function fixReveal() {
  const p = 'tests/shared/reveal.test.tsx';
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(/\/\/ eslint-disable-next-line.*\n/g, '');
  content = content.replace(/\{true && (<div>[^<]+<\/div>)\}/g, '{$1}');
  content = content.replace(/\{false && (<div>[^<]+<\/div>)\}/g, '');
  fs.writeFileSync(p, content);
}

function fixMasonry() {
  const p = 'tests/ui/masonry.test.tsx';
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(/\/\/ eslint-disable-next-line.*\n/g, '');
  content = content.replace(/\{true && (<MasonryItem><div>[^<]+<\/div><\/MasonryItem>)\}/g, '{$1}');
  content = content.replace(/\{false && (<MasonryItem><div>[^<]+<\/div><\/MasonryItem>)\}/g, '');
  fs.writeFileSync(p, content);
}

function fixHelpPage() {
  const p = 'features/buddy-planner/components/help/HelpPage.tsx';
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(/"(Read-only access[^"]+)"/g, '&quot;$1&quot;');
  content = content.replace(/"no\n          matches — clear filters\?"/g, '&quot;no\n          matches — clear filters?&quot;');
  content = content.replace(/"where do I\n          start\?"/g, '&quot;where do I\n          start?&quot;');
  content = content.replace(/"where does Ayush sit\?"/g, '&quot;where does Ayush sit?&quot;');
  content = content.replace(/you'll/g, 'you&apos;ll');
  content = content.replace(/don't/g, 'don&apos;t');
  content = content.replace(/can't/g, 'can&apos;t');
  content = content.replace(/won't/g, 'won&apos;t');
  content = content.replace(/isn't/g, 'isn&apos;t');
  content = content.replace(/aren't/g, 'aren&apos;t');
  content = content.replace(/it's/g, 'it&apos;s');
  content = content.replace(/It's/g, 'It&apos;s');
  content = content.replace(/I'm/g, 'I&apos;m');
  content = content.replace(/we're/g, 'we&apos;re');
  content = content.replace(/they're/g, 'they&apos;re');
  content = content.replace(/you're/g, 'you&apos;re');
  content = content.replace(/let's/g, 'let&apos;s');
  content = content.replace(/Let's/g, 'Let&apos;s');
  content = content.replace(/doesn't/g, 'doesn&apos;t');
  content = content.replace(/didn't/g, 'didn&apos;t');
  content = content.replace(/hasn't/g, 'hasn&apos;t');
  content = content.replace(/couldn't/g, 'couldn&apos;t');
  content = content.replace(/wouldn't/g, 'wouldn&apos;t');
  content = content.replace(/shouldn't/g, 'shouldn&apos;t');
  content = content.replace(/aren't/g, 'aren&apos;t');
  
  content = content.replace(/"Floor 3 has 12\n          assigned employees. They will be unassigned."/g, '&quot;Floor 3 has 12\n          assigned employees. They will be unassigned.&quot;');
  
  // Fix specific occurrences for `HelpPage.tsx`
  content = content.replace(/team's/g, 'team&apos;s');
  content = content.replace(/today's/g, 'today&apos;s');
  content = content.replace(/building's/g, 'building&apos;s');
  content = content.replace(/element's/g, 'element&apos;s');
  content = content.replace(/selection's/g, 'selection&apos;s');
  content = content.replace(/Ayush's/g, 'Ayush&apos;s');
  content = content.replace(/anyone's/g, 'anyone&apos;s');
  
  content = content.replace(/"Copied!"/g, '&quot;Copied!&quot;');
  
  fs.writeFileSync(p, content);
}

fixReveal();
fixMasonry();
fixHelpPage();
console.log('Fixed linting issues in tests and HelpPage.');

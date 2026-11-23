import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const load = name => JSON.parse(fs.readFileSync('public/data/' + name, 'utf8'));
const lessons = [
  ...load('dsa.json').problems.map(p => ({name:p.slug,code:p.javaCode})),
  ...['a','b','c','d','e'].flatMap(letter =>
    load('dsa-solutions-' + letter + '.json').solutions.map(p => ({name:p.slug,code:p.javaCode}))),
  ...load('dsa-concepts.json').concepts.map(c => ({
    name:c.stageId + '/' + c.id,code:c.javaCode}))
];
const seen = new Set();
const distinct = lessons.filter(item => {
  if (seen.has(item.code)) return false;
  seen.add(item.code);
  return true;
});
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'dsa-javac-'));
const sources = [];
const common = `class ListNode {
    int val; ListNode next;
    ListNode() {}
    ListNode(int x) { val = x; }
    ListNode(int x,ListNode next) { val=x; this.next=next; }
}
class TreeNode {
    int val; TreeNode left,right;
    TreeNode() {}
    TreeNode(int x) { val=x; }
    TreeNode(int x,TreeNode left,TreeNode right) { val=x;this.left=left;this.right=right; }
}
class Node {
    int val;
    Node next,random;
    java.util.List<Node> neighbors=new java.util.ArrayList<>();
    Node() {}
    Node(int val) { this.val=val; }
    Node(int val,java.util.ArrayList<Node> neighbors) { this.val=val; this.neighbors=neighbors; }
}
`;
try {
  for (let i=0;i<distinct.length;i++) {
    const item=distinct[i], packageName='dsa.exercise'+i;
    const match=item.code.match(/(?:^|\n)\s*(?:public\s+)?class\s+([A-Za-z_]\w*)/m);
    if (!match) throw new Error('Cannot identify main Java class in ' + item.name);
    const dir=path.join(temp,'src','dsa','exercise'+i);
    fs.mkdirSync(dir,{recursive:true});
    const file=path.join(dir,match[1]+'.java');
    fs.writeFileSync(file,'package '+packageName+';\n'+item.code+'\n');
    fs.writeFileSync(path.join(dir,'JudgeNodes.java'),'package '+packageName+';\n'+common);
    sources.push(file,path.join(dir,'JudgeNodes.java'));
  }
  execFileSync('javac',['-encoding','UTF-8','-d',path.join(temp,'out'),...sources],{
    timeout:180000,maxBuffer:16*1024*1024,stdio:['ignore','pipe','pipe']
  });
  console.log('Java compiler verified:',distinct.length,'unique snippets across',lessons.length,'worked and topic lessons');
} catch (error) {
  const detail=error.stderr?.toString() || error.message;
  console.error('Java compilation failed:\n'+detail);
  process.exitCode=1;
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}

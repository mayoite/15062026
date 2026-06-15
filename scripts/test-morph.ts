import { Project } from "ts-morph";
import path from "path";

async function main() {
  const project = new Project({
    tsConfigFilePath: "tsconfig.json",
  });

  const absPath = path.resolve('lib/db.ts');
  const sourceFile = project.getSourceFile(absPath);
  
  if (sourceFile) {
    console.log(`Found db.ts at ${absPath}!`);
  } else {
    console.log(`FAILED to find db.ts at ${absPath}. Available files:`);
    console.log(project.getSourceFiles().slice(0, 5).map(f => f.getFilePath()));
  }
}

main().catch(console.error);

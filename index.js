import fse from "fs-extra"

async function fun () {
  const content = await fse.readFile('./README.md', 'utf8')
  console.log(content)
}
fun()

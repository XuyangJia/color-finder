import { resolve } from 'path'
import fse from 'fs-extra'
import { downloadConfig, getColors, mergeObjects } from './utils.js'

async function fun () {
  // 下载配置
  await downloadConfig()
  const projectDir = 'D:/work/Client'

  // 配置中使用的颜色
  const colors_config = await getColors('./dest/configs')
  // UI中使用的颜色
  const colors_ui = await getColors(resolve(projectDir, 'bin/h5/uiExportCfg.json'))
  // 战斗中使用的颜色
  const path_fight = resolve(projectDir, 'src/sg/fight')
  const colors_fight = await getColors(path_fight, resolve(path_fight, 'test'))
  const path_ConfigColor = resolve(projectDir, 'src/sg/cfg/ConfigColor.as')
  const colors_ConfigColor = await getColors(path_ConfigColor)
  const colors_exclude = mergeObjects(Object.values(colors_fight).concat(Object.values(colors_ConfigColor)))
  // 代码中使用的颜色
  const colors_code = await getColors(resolve(projectDir, 'src/sg'), [path_fight, path_ConfigColor])

  const colors_all = mergeObjects([Object.values(colors_config), Object.values(colors_ui), Object.values(colors_code)].flat())
  const colors_conflict = {}
  for (const key in colors_exclude) {
    if (colors_all[key]) {
      colors_conflict[key] = colors_all[key]
    }
  }
  fse.writeJSON('./dest/colorsAll.json', colors_all)
  console.log(colors_conflict)
}
fun()

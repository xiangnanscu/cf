/**
 * 解析本地人员数据
 * @param {string} data - 本地人员数据文本
 * @returns {Array} 解析后的人员数据列表
 */
export function parseLocalPersonnel(data) {
  if (!data) return [];

  return data
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const lastSpaceIndex = line.lastIndexOf("-") || line.lastIndexOf(" ");
      if (lastSpaceIndex === -1) {
        return { name: line, position: "", raw: line };
      }
      const name = line.substring(0, lastSpaceIndex).replace(/\s/g, "");
      const position = line.substring(lastSpaceIndex + 1).replace(/\s/g, "");
      return { name, position, raw: line };
    })
    .filter((person) => person.name.length > 0);
}

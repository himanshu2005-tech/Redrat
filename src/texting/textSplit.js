export const splitString = string => {
  return string.split(/(\s+)/);
};

export const concatString = stringArray => {
  if (!Array.isArray(stringArray)) {
    null
  }
  return stringArray.join("");
};

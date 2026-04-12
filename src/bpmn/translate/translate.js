import translations from './zh'

export default function translate(template, replacements) {
  replacements = replacements || {};


  let arr = template.split(' ')
  for (var i = 1, len = arr.length; i < len; i++) {
    arr[i] = arr[i].toLowerCase();
  }
  template = arr.join(' ');

  if (!translations[template]) {
    console.log(template)
  }

  // Translate
  template = translations[template] || template;

  // Replace
  return template.replace(/{([^}]+)}/g, function(_, key) {
    let str = replacements[key];
    if (translations[replacements[key]] !== null
      && translations[replacements[key]] !== 'undefined') {
      str = translations[replacements[key]];
    }

    return str || '{' + key + '}';
  });
}
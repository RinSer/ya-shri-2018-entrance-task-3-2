# CLI приложение на платформе node.js
## В папке, где лежит файл solution.js:
```
node solution.js [./--input-file-path--] [./--output-file-path--]
```

## Параметры файлов для входящих и обработанных данных являются необязательными.
## Комманда ``` node solution.js ``` обработает данные из файла ./data/input.json 

## Чтобы программа исполнялась последняя строка в файле solution.js не должна быть комментарием:
```
// Execution
var main = module.exports.processData;
console.log(main(data.getData()));
```

# Тесты
## В папке, где лежат все файлы приложения:
```
node testSolution.js
```
## Чтобы тесты исполнялись без вывода лишних данных надо закомментировать последнюю строку в файле solution.js:
```
// Execution
var main = module.exports.processData;
//console.log(main(data.getData()));
```

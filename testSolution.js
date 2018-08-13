const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
var data = require('./data');
var main = require('./solution');

/**
 * Проверка валидатора входящих данных
 */
(testErrorDataValidation = () => {
    try {
        var mode = { name: 'many', break: true };
        var initData = data.getData(mode);
        main.processData(initData);
        console.log(FgRed, "Ошибка: валидатор пропустил перегруз мощности!");
        throw "TestFail";
    } catch (e) {
        if (e === "InputValidationError") {
            return console.log(FgGreen, "Тест 1 пройден: появление ошибки валидации входящих данных");
        } else throw "TestFail";
    }
})();

/**
 * Проверка правильного распределения усройств по 
 * времени дня и проверка максимально возможного 
 * добавления устройств в расписание
 */
(testFullCapacity = () => {
    var devName = "Духовка";
    var initData = data.getData();
    for (var i = 1; i < 7; i++) {
        var device = Object.assign({}, initData.devices.find(d => d.name === devName));
        device.id = `${i}`;
        initData.devices.push(device);
    }

    var result = JSON.parse(main.processData(initData));
    var devIds = initData.devices.filter(d => d.name === devName).map(d => d.id);
    
    // Проверяем, что Духовки расположились равномерно в течении дня
    for (var i = 7; i < 21; i++) {
        if (result.schedule[i].filter(id => devIds.indexOf(id) > -1).length !== 1) {
            console.log(FgRed, "Ошибка: какие-то духовки не отработают весь цикл!");
            throw "TestFail";
        }
    }
    // Проверяем, что Духовок нет ночью
    for (var i = -3; i < 7; i++) {
        var h = i;
        if (h < 0) h += 24;
        if (result.schedule[h].filter(id => devIds.indexOf(id) > -1).length !== 0) {
            console.log(FgRed, "Ошибка: какие-то духовки работают ночью!");
            throw "TestFail";
        }
    }

    console.log(FgGreen, "Тест 2 пройден: все духовки работают правильно");
})();

/**
 * Проверка ошибки, когда валидатор пропускает
 * устройства по мощности, но распределить их 
 * в расписании так, чтобы каждое выполнило 
 * цикл в рамках времени дня невозможно
 */
(testConsistancyError = () => {
    var devName = "Посудомоечная машина";
    var initData = data.getData();
    if (initData.devices.length > 5)
        initData.devices.splice(5, initData.devices.length - 5);
    for (var i = 1; i < 7; i++) {
        var device = Object.assign({}, initData.devices.find(d => d.name === devName));
        device.id = `${i}`;
        initData.devices.push(device);
    }
    
    try {
        main.processData(initData);
        console.log(FgRed, "Oшибка: в расписание вместилось невместимое!");
        throw "TestFail";
    } catch (e) {
        if (e === "DataConsistancyError") {
            return console.log(FgGreen, "Тест 3 пройден: появление ошибки несостоятельности обрабатываемых данных");
        } else throw "TestFail";
    }
})();
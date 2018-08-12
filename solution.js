function getData() {
    let initialData = require('./data/input.json');
    return initialData;
}

/**
 * Валидация устройств: у каждого 
 * вводимого устройства должен быть 
 * идентификатор, мощность 
 * и продолжительность цикла
 * @param {*} device 
 */
function validateDevice(device, maxPower) {
    if (!device.id || typeof device.id !== 'string')
        return false;
    if (!device.power || typeof device.power !== 'number' || device.power > maxPower)
        return false;
    if (!device.duration || typeof device.duration !== 'number' || device.duration > 24)
        return false;
    if (device.mode && device.duration > 12)
        return false;
    return true;
}

/**
 * Простая проверка на состоятельность:
 * если суммарная потребляемая мощность 
 * приборов за сутки превышает максимально
 * возможную мощность, помноженную на 24, 
 * то данный список устройств должен 
 * считаться несостоятельным, так как 
 * мы не можем дать каждому устройству
 * отработать полный цикл
 */
function validateConsistancy(devices, maxPower) {
    maxEnergy = maxPower * 24;
    return maxConsumption(devices) <= maxEnergy;
}

function maxConsumption(devices) {
    return devices.reduce((acc, device) => {
        return acc + device.power * device.duration;
    }, 0);
} 

function processData() {
    const NIGHT_START = 21;
    const DAY_START = 7;
    
    let initial = getData();
    const MAX_POWER = initial.maxPower;
    let rates = initial.rates;
    let devices = initial.devices.filter(d => validateDevice(d));
    if (!validateConsistancy(devices, MAX_POWER))
        return 'Невозможно запустить каждое устройство в течении суток!';
    // Создаём расписание устройств
    // и добавляем все устройства, которые должны работать
    // круглосуточно к каждому часу в расписании
    var atclocks = devices.filter(d => d.duration === 24);
    var schedule = {};
    for (var i = 0; i < 24; i++)
     schedule[i] = atclocks.map(a => a.id);
    // Добавляем устройства, работающие в любое время суток
    var anytimes = devices.filter(d => d.duration !== 24);
    for (var device of anytimes) {
        var period = null;
        if (device.mode) {
            if (device.mode === 'day')
                period = { from: DAY_START, to: NIGHT_START };
            if (device.mode === 'night')
                period = { from: NIGHT_START, to: DAY_START };
        }
        var rate = optimalRatesSort(rates, period)[0];
        var duration = device.duration;
        var otherDevs = [];
        for (var t = 0; t < duration; t++) {
            var hour = rate.from + t; 
            if (hour > 23) hour = hour % 24;
            otherDevs = otherDevs.concat(devices.filter(d => schedule[hour].indexOf(d.id) > -1));
        }
        if (otherDevs.reduce((acc, d) => acc + d.power, 0) + device.power * duration <= MAX_POWER * duration) {
            for (var h = rate.from; h < rate.from + duration; h++) {
                var hour = h; 
                if (hour > 23) hour = hour % 24;
                schedule[hour].push(device.id);
            }
        } else {

        }
    }
    
    console.log(JSON.stringify(schedule));
}

function optimalRatesSort(irates, period = null) {
    let rates = period === null ? irates : irates.filter(r => r.from >= period.from || r.to <= period.to);
    return rates.sort((a, b) => {
        if (a.value < b.value)
            return -1;
        if (b.value < a.value)
            return 1;
        return 0;
    });
}

processData();
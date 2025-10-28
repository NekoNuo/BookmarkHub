import OptionsSync from 'webext-options-sync';
/* global OptionsSync */

export default new OptionsSync({
    defaults: {
        githubToken: '',
        gistID: '',
        gistFileName: 'BookmarkHub',
        enableNotify: true,
        githubURL: 'https://api.github.com',
        enableMultiBrowser: false, // 是否启用多浏览器模式
        useCustomFileName: false, // 多浏览器模式下是否使用自定义文件名
        customFileName: '', // 自定义文件名
        enableAutoSync: false, // 是否启用定时上传
        autoSyncInterval: 60, // 定时上传间隔（分钟），默认60分钟
    },

    // List of functions that are called when the extension is updated
    migrations: [
        (savedOptions, currentDefaults) => {
            // Perhaps it was renamed
            // if (savedOptions.colour) {
            //     savedOptions.color = savedOptions.colour;
            //delete savedOptions.colour;
            // }
        },

        // Integrated utility that drops any properties that don't appear in the defaults
        OptionsSync.migrations.removeUnused
    ],
    logging: false
});
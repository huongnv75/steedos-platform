"use strict";

const objectql = require('@steedos/objectql');
const core = require('@steedos/core');
const triggerLoader = require('./lib').triggerLoader;
const path = require('path');
const Future = require('fibers/future');
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "service-meteor-package-loader",

	/**
	 * Settings
	 */
	settings: {
		path: '', // 扫描加载原数据的路径
		name: '' // service name
	},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {

	},

	/**
	 * Events
	 */
	events: {
		"translations.change": {
            handler() {
				core.loadTranslations()
            }
        },
		"translations.object.change": {
            handler() {
				core.loadObjectTranslations()
            }
        }
	},

	/**
	 * Methods
	 */
	methods: {
		loadPackageMetadataFiles: async function (packagePath, name) {
			await Future.task(async () => {
				let steedosSchema = objectql.getSteedosSchema(this.broker);
				steedosSchema.addMeteorDatasource();
				packagePath = path.join(packagePath, '**');
				objectql.loadStandardObjects();
				await objectql.addAllConfigFiles(packagePath, 'meteor');
				const datasource = objectql.getDataSource('meteor');
				await datasource.init();
				await triggerLoader.load(this.broker, packagePath, name);
				return;
			}).promise();
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		this.logger.debug('service package loader created!!!');
	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {
		let packageInfo = this.settings.packageInfo;
		const { path, name } = packageInfo;
		if (!path || !name) {
			this.logger.error(`Please config packageInfo in your settings.`);
			return;
		}
		await this.loadPackageMetadataFiles(path, name);
		console.log(`service ${name} started`);
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {

	}
};
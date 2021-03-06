/*
+-----------------------------------------------------------------------------------------------------------------------
| Author: atzcl <atzcl0310@gmail.com>  https://github.com/atzcl
+-----------------------------------------------------------------------------------------------------------------------
| 拓展 helper
|
*/

import { EggAppConfig, Context } from 'egg';
import { createHash } from 'crypto';
import { random } from 'lodash';
import * as Moment from 'moment';
import * as bcryptjs from 'bcryptjs';
import * as path from 'path';
import * as UUID from 'uuid';

import CacheManager from '@/app/foundation/support/cache';
import JwtManager from '@/app/foundation/support/jwt';

export default {
  /**
   * 获取 egg loader 当前 helper 拓展时，注入的 BaseContextClass
   *
   * @param this
   */
  getContext(this: any): Context {
    return this;
  },

  /**
   * 响应返回
   *
   * @param { number } total 如果是分页返回的话，应该加上 count 总页数数据
   *
   * @returns { object }
   */
  toResponse(code: number, data: any, msg: string = 'success') {
    const response = {
      code,
      data,
      msg,
      time: Moment().unix(),
    };

    // 响应返回
    this.getContext().ctx.response.body = response;
  },

  /**
   * bcryptjs 加密
   *
   * @param {string} value 需要加密的值
   * @param {number} salt 加密的强度 0 - 12
   *
   * @returns string
   */
  createBcrypt(value: string, salt: number = 10): string {
    return bcryptjs.hashSync(value, bcryptjs.genSaltSync(salt));
  },

  /**
   * 比对输入值与已加密值是否一致
   *
   * @param {string} value 输入值
   * @param {string} hash 已加密的 hash 值
   *
   * @returns boolean
   */
  verifyBcrypt(value: string, hash: string): boolean {
    return bcryptjs.compareSync(value, hash);
  },

  /**
   * 生成 MD5
   *
   * @param value 加密的值
   */
  generateMD5(value: string | Buffer | DataView) {
    return createHash('md5')
      .update(value)
      .digest('hex');
  },

  /**
   * 生成唯一随机字符串
   */
  generateUniqId() {
    return this.generateMD5(UUID.v4());
  },

  /**
   * 生成随机字符串
   *
   * @param {string} len 字符长度
   * @param {string} type 生成的类型
   *
   * @returns {string}
   */
  strRandom(len = 16, type: 'string' | 'number' | 'all' = 'all') {
    const number = '0123456789';
    // todo: 去掉了某些特殊的字符, 后面可以参考加上
    const letter =
      'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    let chars = '';
    switch (type) {
      case 'number':
        chars = number;
        break;
      case 'string':
        chars = letter;
        break;
      default:
        chars = letter + number;
        break;
    }

    let strValue = '';
    for (let index = 0; index < len; index++) {
      strValue += chars[random(0, chars.length - 1)];
    }

    return strValue;
  },

  /**
   * 验证上传文件的格式
   *
   * @param {string} filename 上传的文件名
   * @param {string[]} [whitelist=[]] 上传文件的格式白名单
   */
  checkUploadFileExt(filename: string, whitelist: string[] = []) {
    if (whitelist.length === 0) {
      whitelist = this.getContext().config.myApp.uploadExtWhiteList;
    }

    if (! whitelist.includes(path.extname(filename).toLowerCase())) {
      this.getContext().ctx.abort(400, `当前文件: ${filename} 的格式不符合要求`);
    }
  },

  /**
   * 缓存辅助函数
   *
   * todo: 当前只简单地返回缓存实例
   * todo: 待实现缓存底层的类型切换、快捷的缓存操作
   */
  cache() {
    const { app, config } = this.getContext();

    // 给 app 加上 any, 避免在使用 typeorm cli 时出错
    return new CacheManager(
      (app as any).redis,
      config.myApp.appName || 'atzcl',
    );
  },

  /**
   * jwt 辅助函数
   */
  jwt(options: EggAppConfig['jwt'] | any = {}) {
    const { app, config } = this.getContext();

    return new JwtManager(
      (app as any).jwt,
      { ...config.jwt, ...options },
      this.cache(),
    );
  },
};

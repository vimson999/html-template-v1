# 开始
- 点击绿色run按钮
- 编辑 [index.ts](#src/index.ts) 并观看实时更新！

# 了解更多

您可以在[多维表格扩展脚本开发指南](https://feishu.feishu.cn/docx/U3wodO5eqome3uxFAC3cl0qanIe)中了解更多信息 ）。

## 安装包
在 Shell 窗格中安装npm包或在 Packages 窗格中搜索并添加。

## 国际化
本模板使用[jquery-i18next](https://locize.com/blog/jquery-i18next/)进行国际化。
- 在js文件中通过$.t()调用，如中文环境下:
```js
console.log($.t('content', {num:888})) // '这是中文内容888'
console.log($.t('title')) // '这是中文标题'
```
## 发布
请先npm run build，连同dist目录一起提交，然后再填写表单：
[共享表单](https://feishu.feishu.cn/share/base/form/shrcnGFgOOsFGew3SDZHPhzkM0e)

- 在标签中使用:
通过将属性data-i18n设置为某个语言配置的key，在使用该语言的时候，将使用该key对应的值覆盖标签的内容，从而实现国际化。
data-i18n-options用于插值，同$.t函数的第二个参数，将替换语言配置中被{{}}包裹的变量。

```html
<h1 data-i18n="title">默认标题</h1>

<h2 data-i18n="content" data-i18n-options='{"num":888}'> </h2>
```

如果要在input等不含子元素的元素中使用，则需要给data-i18n属性值加上 [希望赋值的标签属性] 前缀，
比如，给input的placeholder属性进行国际化配置：

```html
<input data-i18n="[placeholder]title"/>

```





# Getting Started
- Hit run
- Edit [index.ts](#src/index.ts) and watch it live update!

# Learn More

You can learn more in the [Base Extension Development Guide](https://lark-technologies.larksuite.com/docx/HvCbdSzXNowzMmxWgXsuB2Ngs7d)

## Install packages

Install packages in Shell pane or search and add in Packages pane.


## globalization
This template uses [jquery-i18next](https://locize.com/blog/jquery-i18next/) for internationalization.
- Called through $.t() in the js file, such as in Chinese environment:
```js
console.log($.t('content', {num:888})) // '这是中文内容888'
console.log($.t('title')) // '这是中文标题'
```

## Publish
Please npm run build first, submit it together with the dist directory, and then fill in the form:
[Share form](https://feishu.feishu.cn/share/base/form/shrcnGFgOOsFGew3SDZHPhzkM0e)

- Use in tags:
By setting the attribute data-i18n to the key configured in a certain language, when using that language, the value corresponding to the key will be used to overwrite the content of the tag, thereby achieving internationalization.
data-i18n-options are used for interpolation. They are the same as the second parameter of the $.t function and will replace the variables wrapped in {{}} in the language configuration.
```html
<h1 data-i18n="title">默认标题</h1>

<h2 data-i18n="content" data-i18n-options='{"num":888}'> </h2>
```

If you want to use it in an element without child elements such as input, you need to prefix the data-i18n attribute value with [the label attribute you want to assign].
For example, configure internationalization for the placeholder attribute of input:
```html
<input data-i18n="[placeholder]title"/>

```



现在我有一个插件需求
1：允许用户选择当前操作意图，
    下拉框里填充 获取视频文案、分析短视频数据走势、获取视频评论、关键字搜索、获取视频作者、分析视频作者数据
2：页面上有一个输入框，用户可以输入视频链接、作者链接、搜索词
3：页面上有一个输入框，用户可以输入调用api的 key
4：页面上有一个 Select Table，让用户选择数据写入的 table 
5：页面上有一个按钮，用户点击按钮，插件会根据用户选择的意图，调用对应的api，将结果保存到表格中,每种数据的返回格式不同，需要根据返回格式进行解析，将数据保存到表格中


https://ycn0x2weafez.feishu.cn/base/QJzUb6WtzaAnXWs4m35cI5tEn3f?table=tblNMlmDmdGgMmvj&view=vewryBE8gE

npm i
npm run dev


AIzaSyCamqvTHNZnNw4w_x2sSP8nq2PO33Lqt5c

git push origin main

https://lark-base-team.github.io/js-sdk-docs/zh/api/table#addrecord



50871805b4160a5f51b44b235e4f3c8eda33cebcb03f985544db72f3a1dac6ba
-------------------------------------------------------------------
-------------------------------------------------------------------


 6.94 06/14 D@H.ip UYM:/ 使用飞书表格获取视频文案和播放信息 给大家分享一个集成了AI能力的飞书多维表格哈 它能帮你： 一键提取核心信息： 只需粘贴视频链接 (支持DY、小X书、快X手、B站等主流平台)，表格自动抓取标题、作者、各项数据指标、封面、甚至视频文案原文！ AI智能深度剖析： 更牛的是，内置AI将基于提取的文案，为你： 精炼核心观点：迅速抓住内容灵魂。 总结爆款公式：洞察可复制的成功模式。 拆解黄金三秒：分析吸睛开局的秘诀。 生成高能流量文案：提供可借鉴的转化话术。 告别繁琐重复，让你从“苦力分析”到“策略洞察”，把时间花在更有价值的创意和优化上！ 操作简单到只需两步： 打开你的飞书。 在我分享的表格链接里，第一列填入视频URL。 其他全自动！是不是感觉创作效率瞬间Max？ ﻿# 文案不再愁[话题]# # 文案收集 # 文案提取  https://v.douyin.com/Bi2WyEwcagA/ 复制此链接，打开Dou音搜索，直接观看视频！

 https://www.xiaohongshu.com/explore/67e2b3f900000000030286ce
 https://www.bilibili.com/video/BV1EV5iznEQZ?spm_id_from=333.1007.tianma.3-2-6.click
 https://www.kuaishou.com/f/X34s4ikwqfv7vZN


------------------------------------------------------------------
-------------------------------------------------------------------



第一步：点击飞书表格右上角【插件】，
选择【短视频数据侦探】

默认选中的是【基础信息和文案】，
第二步填入要提取的短视频地址

打开抖音，复制链接地址
填进来地址信息

第三步，我们可以选择新建表格

第四步，关注公众号领取新手福利后，
查询我们的免费API-KEY，复制

粘贴之后，
我们点击执行

插件会提示我们已经开始处理，
稍等一会儿

插件会提示我们自动创建了一个表格

打开表格，看到我们拉取到的数据

调整一下行高浏览数据

怎么样，你学会了吗

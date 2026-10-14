# ZenTao 22.7 OpenAPI 接口变更清单

整理日期：2026-10-14。比较基线：`adc731b`；同步及修复完成版本：`8969b9e`。本次范围包括 OpenAPI 更新提交 `4ecff8e` 和注册表同步提交 `8969b9e`。

本文根据仓库中的 `data/zentao-openapi.json`、`scripts/zentao-api-map.json`、`src/modules/generated.ts` 和运行时内置覆盖整理。新增与变更以 method + path 为单位统计；响应 schema 的变化表示文档契约变化，未通过真实服务请求确认服务端行为。

## 1. 概览

| 项目 | 数量 / 结论 |
| --- | --- |
| OpenAPI operation 总数 | 238 → 368（含 1 个 Token operation） |
| 新增接口 | 130 |
| 已有接口契约或元数据变化 | 55 |
| 仅示例变化 | 31 |
| 未变化的已有接口 | 152 |
| 删除接口 | 0 |
| 共享 components 变化 | 0 |
| 生成注册表 | 40 个模块、354 个 action、145 个 GET action |
| 应用内置覆盖后的运行时注册表 | 42 个模块、360 个 action、149 个 GET action |
| 业务接口覆盖 | 367 = 345 个直接覆盖 + 22 个合并覆盖；遗漏 0，另排除 1 个 Token operation |
| 命名 / GET 提取字段 | 未解决重名 0；生成 GET 缺失 resultGetter 0 |

130 个新增 OpenAPI operation 对应 126 个生成 action，其中 8 个已由旧版 SDK 的内置覆盖提供，本次迁入生成流程。因此本次实际新增 SDK action 为 **118 个**，运行时 action 总数从 242 增至 360。4 组项目 / 执行列表共 8 个 operation 合并为 4 个 action。

### 版本要求

本次新增到 OpenAPI 的 130 个接口统一设置以下 `minVersion`。已有接口保留原来的最低版本；迁入生成流程的知识库接口按本次要求补入开源版 `22.7`。版本元数据不代替服务端权限与功能可用性检查。

| 版本系列 | minVersion |
| --- | --- |
| 开源版 | `22.7` |
| Biz | `biz13.7` |
| Max | `max8.7` |
| IPD | `ipd5.7` |

### 阅读约定

- 路径均相对于 `/api.php/v2`，花括号中的变量是必填路径参数。
- SDK action 使用 `模块-action` 作为清单标识；调用时使用 `request("模块/action", params)`，例如 `workflow-createFlow` 对应 `request("workflow/createFlow", params)`。
- 参数栏以最终 SDK 注册定义为准；`*` 表示 schema 标记的必填项，`=值` 表示 SDK 注册的默认值。Body 展示顶层字段，嵌套对象的详细结构见 OpenAPI。
- 参数栏 `—` 表示没有 Query / Body，路径参数仍按 URL 传入。
- 结果栏为 SDK 的 `resultType` 和 `resultGetter`；“分页”表示注册了 `pagerGetter`。没有专用提取字段的写接口仍通过标准响应处理流程返回结果。
- “迁入生成流程”表示保持原有 SDK action 名和行为，不能算作首次新增 SDK 支持。

## 2. 新增接口（130 个）

| 模块 | 新增 OpenAPI operation | 对应生成 action |
| --- | --- | --- |
| auditplan | 8 | 7 |
| baseline | 5 | 5 |
| change | 5 | 5 |
| deliverable | 4 | 4 |
| nc | 7 | 6 |
| opportunity | 7 | 6 |
| relation | 4 | 4 |
| weekly | 5 | 5 |
| workflow | 50 | 50 |
| knowledgelib | 1 | 1 |
| knowledge | 4 | 4 |
| db | 3 | 3 |
| process | 4 | 3 |
| my | 17 | 17 |
| resourcecalendar | 1 | 1 |
| todo | 1 | 1 |
| workflowgroup | 1 | 1 |
| execution | 1 | 1 |
| project | 2 | 2 |

### 质量保证计划（auditplan，8 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `DELETE /auditplans/{auditplanID}` | `auditplan-delete` | 删除质量保证计划 | — | `text` |
| `GET /auditplans/{auditplanID}` | `auditplan-get` | 获取质量保证详情 | — | `object`，提取 `auditplan` |
| `GET /executions/{executionID}/auditplans` | `auditplan-list` | 获取执行质量保证列表 | Query：`browseType=all`、`param`、`orderBy=id_desc`、`recPerPage=20`、`pageID=1`、`filters`、`groupJoin` | `list`，提取 `auditplans`；分页 |
| `GET /projects/{projectID}/auditplans` | `auditplan-list` | 获取项目质量保证列表 | Query：`browseType=all`、`param`、`orderBy=id_desc`、`recPerPage=20`、`pageID=1`、`filters`、`groupJoin` | `list`，提取 `auditplans`；分页 |
| `POST /auditplans` | `auditplan-create` | 新增质量保证计划 | Body：`projectID*:integer`、`execution:integer`、`process*:integer`、`objectID*:integer`、`objectType:string`、`status:string`、`isCycle:integer`、`checkDateList:array<string>`、`assignedToList:array<string>` | `object` |
| `POST /auditplans/{auditplanID}/check` | `auditplan-check` | 检查质量保证计划 | Body：`listID*:array<string>`、`result*:array<string>`、`status:array<string>` | `text` |
| `POST /projects/{projectID}/auditplans/batch` | `auditplan-batchCreate` | 批量新增项目质量保证计划 | Body：`process*:array<string>`、`execution:array<string>`、`objectID*:array<string>`、`objectType:array<string>`、`checkDate*:array<string>`、`assignedTo:array<string>`、`status:array<string>` | `text` |
| `PUT /auditplans/{auditplanID}` | `auditplan-update` | 编辑质量保证计划 | Body：`execution:integer`、`process:integer`、`objectID:integer`、`objectType:string`、`status:string`、`assignedTo:string`、`comment:string` | `object` |

### 基线（baseline，5 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `DELETE /baselines/{baselineID}` | `baseline-delete` | 删除项目基线 | — | `text` |
| `GET /baselines/{baselineID}` | `baseline-get` | 获取基线详情 | — | `object`，提取 `baseline` |
| `GET /projects/{projectID}/baselines` | `baseline-list` | 获取项目基线列表 | Query：`browseType=all`、`orderBy=id_desc`、`recPerPage=20`、`pageID=1` | `list`，提取 `baselines`；分页 |
| `POST /projects/{projectID}/baselines` | `baseline-create` | 创建项目基线 | Body：`title*:string`、`version*:string`、`category*:array<string>`、`type:string`、`status:string` | `object` |
| `PUT /baselines/{baselineID}` | `baseline-update` | 编辑项目基线 | Body：`title*:string`、`version*:string`、`category*:array<string>`、`comment:string` | `object` |

### 项目变更（change，5 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `DELETE /changes/{changeID}` | `change-delete` | 删除项目变更 | — | `text` |
| `GET /changes/{changeID}` | `change-get` | 获取变更详情 | — | `object`，提取 `projectchange` |
| `GET /projects/{projectID}/changes` | `change-list` | 获取项目变更列表 | Query：`browseType=all`、`orderBy=id_desc`、`recPerPage=20`、`pageID=1` | `list`，提取 `projectchanges`；分页 |
| `POST /projects/{projectID}/changes` | `change-create` | 创建项目变更 | Body：`name*:string`、`urgency*:string`、`type*:string`、`owner*:string`、`reason*:string`、`desc*:string` | `object` |
| `PUT /changes/{changeID}` | `change-update` | 编辑项目变更 | Body：`name*:string`、`urgency*:string`、`type*:string`、`owner*:string`、`reason*:string`、`desc*:string` | `object` |

### 交付物（deliverable，4 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `DELETE /deliverables/{deliverableID}` | `deliverable-delete` | 删除项目交付物 | — | `text` |
| `GET /deliverables/{deliverableID}` | `deliverable-get` | 获取交付物详情 | — | `object`，提取 `deliverable` |
| `GET /projects/{projectID}/deliverables` | `deliverable-list` | 获取项目交付物列表 | Query：`browseType=normal`、`param`、`orderBy=id_desc`、`recPerPage=20`、`pageID=1` | `list`，提取 `deliverables`；分页 |
| `POST /projects/{projectID}/deliverables` | `deliverable-create` | 新增项目交付物 | Body：`deliverable*:integer`、`sourceType*:string`、`sourceID*:integer`、`doc*:object` | `object` |

### 不符合项（nc，7 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `DELETE /ncs/{ncID}` | `nc-delete` | 删除不符合项 | — | `text` |
| `GET /executions/{executionID}/ncs` | `nc-list` | 获取执行不符合项列表 | Query：`browseType=unclosed`、`param`、`orderBy=id_desc`、`recPerPage=20`、`pageID=1` | `list`，提取 `ncs`；分页 |
| `GET /ncs/{ncID}` | `nc-get` | 获取不符合项详情 | — | `object`，提取 `nc` |
| `GET /projects/{projectID}/ncs` | `nc-list` | 获取项目不符合项列表 | Query：`browseType=unclosed`、`param`、`orderBy=id_desc`、`recPerPage=20`、`pageID=1` | `list`，提取 `ncs`；分页 |
| `POST /executions/{executionID}/ncs` | `nc-createExecution` | 新建执行不符合项 | Body：`objectType*:string`、`title*:string`、`auditplan:integer`、`listID:integer`、`severity*:integer`、`type:string` | `object` |
| `POST /projects/{projectID}/ncs` | `nc-createProject` | 新建项目不符合项 | Body：`objectType*:string`、`title*:string`、`execution:integer`、`auditplan:integer`、`listID:integer`、`severity*:integer`、`type:string` | `object` |
| `PUT /ncs/{ncID}` | `nc-update` | 编辑不符合项 | Body：`title*:string`、`type:string`、`execution:integer`、`auditplan:integer`、`listID:integer`、`severity*:integer`、`assignedTo:string`、`deadline:string`、`desc:string` | `object` |

### 机会（opportunity，7 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `DELETE /opportunities/{opportunityID}` | `opportunity-delete` | 删除机会 | — | `text` |
| `GET /executions/{executionID}/opportunities` | `opportunity-list` | 获取执行机会列表 | Query：`browseType=all`、`param`、`orderBy=id_desc`、`recPerPage=20`、`pageID=1`、`filters`、`groupJoin` | `list`，提取 `opportunities`；分页 |
| `GET /opportunities/{opportunityID}` | `opportunity-get` | 获取机会详情 | — | `object`，提取 `opportunity` |
| `GET /projects/{projectID}/opportunities` | `opportunity-list` | 获取项目机会列表 | Query：`browseType=all`、`param`、`orderBy=id_desc`、`recPerPage=20`、`pageID=1`、`filters`、`groupJoin` | `list`，提取 `opportunities`；分页 |
| `POST /projects/{projectID}/opportunities` | `opportunity-create` | 创建项目机会 | Body：`name*:string`、`source:string`、`execution:integer`、`type:string`、`strategy:string`、`impact:integer`、`chance:integer`、`ratio:integer`、`pri:integer`、`identifiedDate:string`、`plannedClosedDate:string`、`assignedTo:string`、`desc:string`、`prevention:string` | `object` |
| `POST /projects/{projectID}/opportunities/batch` | `opportunity-batchCreate` | 批量创建项目机会 | Body：`name*:array<string>`、`source:array<string>`、`execution:array<string>`、`impact:array<string>`、`chance:array<string>`、`pri:array<string>`、`desc:array<string>` | `text` |
| `PUT /opportunities/{opportunityID}` | `opportunity-update` | 编辑机会 | Body：`name:string`、`source:string`、`execution:integer`、`type:string`、`strategy:string`、`status:string`、`impact:integer`、`chance:integer`、`pri:integer`、`assignedTo:string`、`desc:string`、`prevention:string` | `object` |

### 对象关联（relation，4 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `DELETE /relations/{objectType}/{objectID}/{relatedObjectType}/{relatedObjectID}/{relationName}` | `relation-unlink` | 删除关联对象 | — | `text` |
| `GET /relations/{objectType}/{objectID}` | `relation-list` | 查询关联对象 | — | `list`，提取 `relations` |
| `GET /relations/{objectType}/{objectID}/candidates/{relatedObjectType}` | `relation-candidates` | 查询可关联对象 | Query：`browseType`、`orderBy`、`recPerPage`、`pageID` | `list`，提取 `objects`；分页 |
| `POST /relations/{objectType}/{objectID}/{relatedObjectType}` | `relation-link` | 关联对象 | Body：`relation*:array<string>` | `text` |

### 项目周报（weekly，5 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `DELETE /weeklies/{reportID}` | `weekly-delete` | 删除项目周报 | — | `text` |
| `GET /weeklies` | `weekly-list` | 获取项目周报列表 | Query：`projectID*`、`browseType=all`、`param`、`orderBy`、`recPerPage`、`pageID` | `list`，提取 `reports`；分页 |
| `GET /weeklies/{reportID}` | `weekly-get` | 获取项目周报详情 | — | `object`，提取 `report` |
| `POST /weeklies` | `weekly-create` | 创建项目周报 | Body：`projectID*:integer`、`reportModule:string`、`title:string`、`templateID:integer`、`templateDesc:string`、`acl:string`、`status:string` | `object` |
| `PUT /weeklies/{reportID}` | `weekly-update` | 编辑项目周报 | Body：`title:string`、`status:string`、`contentType:string`、`type:string`、`content:string`、`rawContent:string`、`comment:string` | `object` |

### 工作流（workflow，50 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `DELETE /workflowactions/{actionID}` | `workflow-deleteAction` | 删除工作流动作 | — | `text` |
| `DELETE /workflowdatasources/{datasourceID}` | `workflow-deleteDatasource` | 删除数据源 | — | `text` |
| `DELETE /workflowfields/{fieldID}` | `workflow-deleteField` | 删除工作流字段 | — | `text` |
| `DELETE /workflowlabels/{labelID}` | `workflow-deleteLabel` | 删除工作流标签 | — | `text` |
| `DELETE /workflowrules/{ruleID}` | `workflow-deleteRule` | 删除规则 | — | `text` |
| `DELETE /workflows/{flowID}` | `workflow-deleteFlow` | 删除工作流 | — | `text` |
| `DELETE /workflowtables/{tableID}` | `workflow-deleteTable` | 删除工作流数据表 | — | `text` |
| `GET /workflowactions/{actionID}` | `workflow-getAction` | 获取工作流动作详情 | — | `object`，提取 `action` |
| `GET /workflowdatasources` | `workflow-datasources` | 获取数据源列表 | — | `list`，提取 `datasources`；分页 |
| `GET /workflowdatasources/{datasourceID}` | `workflow-getDatasource` | 获取数据源详情 | — | `object`，提取 `datasource` |
| `GET /workflowfields/{fieldID}` | `workflow-getField` | 获取工作流字段详情 | — | `object`，提取 `field` |
| `GET /workflowlabels/{labelID}` | `workflow-getLabel` | 获取工作流标签详情 | — | `object`，提取 `label` |
| `GET /workflowrules` | `workflow-rules` | 获取规则列表 | — | `list`，提取 `rules`；分页 |
| `GET /workflowrules/{ruleID}` | `workflow-getRule` | 获取规则详情 | — | `object`，提取 `rule` |
| `GET /workflows` | `workflow-flows` | 获取工作流列表 | Query：`status`、`app`、`onlyCustom`、`orderBy=id_desc`、`recPerPage=20`、`pageID=1`、`filters`、`groupJoin` | `list`，提取 `flows`；分页 |
| `GET /workflows/{flowID}` | `workflow-getFlow` | 获取工作流详情 | — | `object`，提取 `flow` |
| `GET /workflows/{module}/actions` | `workflow-actions` | 获取工作流动作列表 | — | `list`，提取 `actions` |
| `GET /workflows/{module}/fields` | `workflow-fields` | 获取工作流字段列表 | — | `list`，提取 `fields` |
| `GET /workflows/{module}/labels` | `workflow-labels` | 获取工作流标签列表 | — | `list`，提取 `labels` |
| `GET /workflows/{module}/tables` | `workflow-tables` | 获取工作流数据表列表 | — | `list`，提取 `tables` |
| `GET /workflowtables/{tableID}` | `workflow-getTable` | 获取工作流数据表详情 | — | `object`，提取 `flow` |
| `POST /workflowdatasources` | `workflow-createDatasource` | 创建数据源 | Body：`type*:string`、`name*:string`、`code:string`、`sql:string`、`keyField:string`、`valueField:string` | `object` |
| `POST /workflowrules` | `workflow-createRule` | 创建规则 | Body：`type*:string`、`name*:string`、`rule*:string` | `object` |
| `POST /workflows` | `workflow-createFlow` | 创建工作流 | Body：`module*:string`、`name*:string`、`navigator:string` | `object` |
| `POST /workflows/{flowID}/copy` | `workflow-copyFlow` | 复制工作流 | Body：`module*:string`、`name*:string`、`navigator:string`、`position:string` | `object` |
| `POST /workflows/{module}/actions` | `workflow-createAction` | 创建工作流动作 | Body：`module*:string`、`action*:string`、`name*:string`、`type:string` | `object` |
| `POST /workflows/{module}/fields` | `workflow-createField` | 创建工作流字段 | Body：`name*:string`、`field*:string`、`control*:string`、`type:string`、`length:string` | `object` |
| `POST /workflows/{module}/labels` | `workflow-createLabel` | 创建工作流标签 | Body：`module*:string`、`action*:string`、`code:string`、`label:string`、`type:string`、`fields:array<string>`、`operators:array<string>`、`values:array<string>` | `object` |
| `POST /workflows/{module}/tables` | `workflow-createTable` | 创建工作流数据表 | Body：`module*:string`、`name*:string` | `object` |
| `PUT /workflowactions/{actionID}` | `workflow-updateAction` | 修改工作流动作 | Body：`action*:string`、`name*:string` | `object` |
| `PUT /workflowactions/{actionID}/setCSS` | `workflow-setActionCSS` | 设置动作CSS | Body：`css:string` | `text` |
| `PUT /workflowactions/{actionID}/setJS` | `workflow-setActionJS` | 设置动作JS | Body：`js:string` | `text` |
| `PUT /workflowactions/{actionID}/setNotice` | `workflow-setActionNotice` | 设置动作通知 | Body：`toList*:array<string>` | `text` |
| `PUT /workflowactions/{actionID}/setVerification` | `workflow-setActionVerification` | 设置动作验证 | Body：`type*:string`、`message:string`、`verifications:object` | `text` |
| `PUT /workflowdatasources/{datasourceID}` | `workflow-updateDatasource` | 修改数据源 | Body：`type*:string`、`name*:string`、`code:string`、`sql:string`、`keyField:string`、`valueField:string` | `object` |
| `PUT /workflowfields/{fieldID}` | `workflow-updateField` | 修改工作流字段 | Body：`name*:string`、`control*:string` | `object` |
| `PUT /workflowlabels/{labelID}` | `workflow-updateLabel` | 修改工作流标签 | Body：`label:string`、`type:string`、`fields:array<string>`、`operators:array<string>`、`values:array<string>` | `object` |
| `PUT /workflowrules/{ruleID}` | `workflow-updateRule` | 修改规则 | Body：`type*:string`、`name*:string`、`rule*:string` | `object` |
| `PUT /workflows/{flowID}` | `workflow-updateFlow` | 修改工作流 | Body：`name*:string`、`navigator:string`、`position:string`、`positionModule:string` | `object` |
| `PUT /workflows/{flowID}/activate` | `workflow-activateFlow` | 启用工作流 | — | `text` |
| `PUT /workflows/{flowID}/deactivate` | `workflow-deactivateFlow` | 停用工作流 | — | `text` |
| `PUT /workflows/{flowID}/release` | `workflow-releaseFlow` | 发布工作流 | Body：`navigator*:string`、`position:string`、`positionModule*:string` | `text` |
| `PUT /workflows/{flowID}/setCSS` | `workflow-setFlowCSS` | 设置工作流CSS | Body：`css:string` | `text` |
| `PUT /workflows/{flowID}/setFulltextSearch` | `workflow-setFulltextSearch` | 设置工作流全文检索 | Body：`contentField:array<string>` | `text` |
| `PUT /workflows/{flowID}/setJS` | `workflow-setFlowJS` | 设置工作流JS | Body：`js:string` | `text` |
| `PUT /workflows/{module}/setApproval` | `workflow-setApproval` | 设置工作流审批 | Body：`approval*:string` | `text` |
| `PUT /workflows/{module}/setExport` | `workflow-setExport` | 设置字段导出 | Body：`modules*:array<string>`、`fields:object` | `text` |
| `PUT /workflows/{module}/setSearch` | `workflow-setSearch` | 设置字段搜索 | Body：`modules*:array<string>`、`fields:object` | `text` |
| `PUT /workflows/{module}/setValue` | `workflow-setValue` | 设置字段取值 | Body：`modules*:array<string>`、`fields:object` | `text` |
| `PUT /workflowtables/{tableID}` | `workflow-updateTable` | 修改工作流数据表 | Body：`name*:string` | `object` |

### 知识库（knowledgelib，1 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `GET /ai/knowledgelibs` | `knowledgelib-list` | 获取 AI 知识库列表（迁入生成流程） | Query：`type`、`keyword`、`pageID=1`、`recPerPage=20` | `list`，提取 `data`；分页 |

### 知识（knowledge，4 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `GET /ai/knowledgelibs/{libID}/knowledges` | `knowledge-list` | 获取 AI 知识库内的知识列表（迁入生成流程） | Query：`type`、`objectType`、`pageID=1`、`recPerPage=20` | `list`，提取 `data`；分页 |
| `GET /ai/knowledges/{knowledgeID}` | `knowledge-get` | 获取 AI 知识详情（迁入生成流程） | — | `object`，提取 `data` |
| `POST /ai/knowledges/embeddingssearch` | `knowledge-embeddingsSearch` | 在多个 AI 知识库内向量搜索（迁入生成流程） | Body：`keyword*:string`、`libIDs*:array<integer>`、`type:string`、`objectType:string`、`minSimilarity:number`、`limit:integer` | `list`，提取 `data` |
| `POST /ai/knowledges/search` | `knowledge-search` | 按关键词搜索 AI 知识（迁入生成流程） | Body：`keywords*:array<string>`、`libIDs*:array<integer>`、`matchMode:string`、`type:string`、`objectType:string`、`pageID:integer`、`recPerPage:integer` | `list`，提取 `data`；分页 |

### 数据库（db，3 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `GET /db/tables` | `db-tables` | 获取数据库表列表（迁入生成流程） | — | `list`，提取 `tables` |
| `GET /db/tables/{tableName}` | `db-table` | 获取数据库表结构（迁入生成流程） | SDK 路径参数：`table*`<br>Query：`type=meta` | `object`，提取 `table` |
| `POST /db/query` | `db-query` | 执行SQL查询（迁入生成流程） | Body：`sql*:string`、`page:integer`、`limit:integer`、`count:boolean` | `list`，提取 `rows`；分页 |

### 过程裁剪（process，4 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `GET /executions/{executionID}/processes` | `process-list` | 获取执行过程裁剪情况 | Query：`browseType=wait`、`moduleID=0` | `list`，提取 `processList` |
| `GET /projects/{projectID}/processes` | `process-list` | 获取项目过程裁剪情况 | Query：`browseType=wait`、`moduleID=0` | `list`，提取 `processList` |
| `POST /executions/{executionID}/processes` | `process-setExecution` | 提交执行过程裁剪结果 | Body：`items*:array<string>` | `text` |
| `POST /projects/{projectID}/processes` | `process-setProject` | 提交项目过程裁剪结果 | Body：`items*:array<string>` | `text` |

### 地盘（my，17 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `GET /my/activity/audits` | `my-activityAudits` | 我的地盘-贡献审批 | Query：`browseType`、`orderBy`、`recPerPage`、`pageID` | `list`，提取 `audits`；分页 |
| `GET /my/activity/bugs` | `my-activityBugs` | 我的地盘-贡献 Bug | Query：`browseType`、`orderBy`、`recPerPage`、`pageID`、`filters`、`groupJoin` | `list`，提取 `bugs`；分页 |
| `GET /my/activity/docs` | `my-activityDocs` | 我的地盘-贡献文档 | Query：`browseType`、`orderBy`、`recPerPage`、`pageID` | `list`，提取 `docs`；分页 |
| `GET /my/activity/epics` | `my-activityEpics` | 我的地盘-贡献业务需求 | Query：`browseType`、`orderBy`、`recPerPage`、`pageID`、`filters`、`groupJoin` | `list`，提取 `epics`；分页 |
| `GET /my/activity/feedbacks` | `my-activityFeedbacks` | 我的地盘-贡献反馈 | Query：`browseType`、`orderBy`、`recPerPage`、`pageID`、`filters`、`groupJoin` | `list`，提取 `feedbacks`；分页 |
| `GET /my/activity/issues` | `my-activityIssues` | 我的地盘-贡献问题 | Query：`browseType`、`orderBy`、`recPerPage`、`pageID` | `list`，提取 `issues`；分页 |
| `GET /my/activity/requirements` | `my-activityRequirements` | 我的地盘-贡献用户需求 | Query：`browseType`、`orderBy`、`recPerPage`、`pageID`、`filters`、`groupJoin` | `list`，提取 `requirements`；分页 |
| `GET /my/activity/reviewissues` | `my-activityReviewIssues` | 我的地盘-贡献评审问题 | Query：`browseType`、`orderBy`、`recPerPage`、`pageID`、`filters`、`groupJoin` | `list`，提取 `reviewissues`；分页 |
| `GET /my/activity/risks` | `my-activityRisks` | 我的地盘-贡献风险 | Query：`browseType`、`orderBy`、`recPerPage`、`pageID`、`filters`、`groupJoin` | `list`，提取 `risks`；分页 |
| `GET /my/activity/stories` | `my-activityStories` | 我的地盘-贡献研发需求 | Query：`browseType`、`orderBy`、`recPerPage`、`pageID`、`filters`、`groupJoin` | `list`，提取 `stories`；分页 |
| `GET /my/activity/tasks` | `my-activityTasks` | 我的地盘-贡献任务 | Query：`browseType`、`orderBy`、`recPerPage`、`pageID`、`filters`、`groupJoin` | `list`，提取 `tasks`；分页 |
| `GET /my/activity/testcases` | `my-activityTestCases` | 我的地盘-贡献用例 | Query：`browseType`、`orderBy`、`recPerPage`、`pageID`、`filters`、`groupJoin` | `list`，提取 `testcases`；分页 |
| `GET /my/activity/testtasks` | `my-activityTestTasks` | 我的地盘-贡献测试单 | Query：`browseType`、`orderBy`、`recPerPage`、`pageID` | `list`，提取 `testtasks`；分页 |
| `GET /my/auditplans` | `my-auditPlans` | 我的地盘-待处理审计计划 | Query：`browseType=myChecking`、`orderBy`、`recPerPage`、`pageID` | `list`，提取 `auditplans`；分页 |
| `GET /my/audits` | `my-audits` | 我的地盘-待处理审批 | Query：`browseType=all`、`orderBy`、`recPerPage`、`pageID` | `list`，提取 `audits`；分页 |
| `GET /my/ncs` | `my-ncs` | 我的地盘-待处理不符合项 | Query：`browseType=assignedToMe`、`orderBy`、`recPerPage`、`pageID` | `list`，提取 `ncs`；分页 |
| `GET /my/reviewissues` | `my-reviewIssues` | 我的地盘-待处理评审问题 | Query：`param`、`browseType=assignedTo`、`orderBy`、`recPerPage`、`pageID`、`filters`、`groupJoin` | `list`，提取 `reviewissues`；分页 |

### 人力资源日历（resourcecalendar，1 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `GET /resourcecalendars` | `resourcecalendar-get` | 查询人力资源日历 | Query：`type=company`、`mode=wait`、`accounts`、`projectID`、`depts` | `object`，提取 `resourceCalendars` |

### 待办（todo，1 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `GET /todos/{todoID}` | `todo-get` | 获取待办详情 | — | `object`，提取 `todo` |

### 项目流程（workflowgroup，1 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `GET /workflowgroups` | `workflowgroup-list` | 获取项目流程列表 | Query：`browseType=all`、`orderBy`、`recPerPage`、`pageID` | `list`，提取 `groups`；分页 |

### 执行（execution，1 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `POST /executions/{executionID}/stories/link` | `execution-linkStories` | 执行关联需求 | Body：`stories*:array<string>`、`storyType:string` | `text` |

### 项目（project，2 个接口）

| HTTP 方法与路径 | SDK action | 用途 | 主要参数 | 结果 |
| --- | --- | --- | --- | --- |
| `POST /projects/{projectID}/risks` | `project-createRisk` | 创建项目风险 | Body：`name*:string`、`source:string`、`execution:integer`、`category:string`、`strategy:string`、`impact:integer`、`probability:integer`、`rate:integer`、`pri:integer`、`identifiedDate:string`、`plannedClosedDate:string`、`assignedTo:string`、`prevention:string`、`remedy:string` | `object` |
| `POST /projects/{projectID}/stories/link` | `project-linkStories` | 项目关联需求 | Body：`stories*:array<string>`、`storyType:string` | `text` |

## 3. 已有接口变化（55 个）

以下按主要变化分组，每个 operation 只列一次；同一行可以同时包含查询参数、响应字段和说明变化。所有响应字段的新增、类型修改和移除均指 OpenAPI schema。列表 schema 不再声明某字段，不等于已确认服务端一定不返回该字段。

### 请求体变化（1 个接口）

| HTTP 方法与路径 | SDK action | 变化 |
| --- | --- | --- |
| `PUT /requirements/{storyID}/change` | `requirement-change` | Body 新增 `reviewer:array<string>`（可选；保留 SDK 已有评审兼容逻辑） |

### 查询参数及关联响应变化（19 个接口）

| HTTP 方法与路径 | SDK action | 变化 |
| --- | --- | --- |
| `GET /executions/{executionID}/stories` | `story-list` | Query `filters` 说明：增加 `release(所属发布，示例：all)`<br>响应 `stories[].docs` 说明：新增 `相关文档`<br>响应新增 `stories[].cardColor:string`、`stories[].prevReviewers:string` |
| `GET /my/bugs` | `my-bugs` | Query `browseType`：默认 `all` → `assignedTo`，选项更新<br>Query 新增 `param:string`（搜索参数；browseType=bysearch 或 bySearch 时必填。）<br>响应补全 `bugs[]` 的对象字段定义<br>响应 `bugs[]`：`string` → `object` |
| `GET /my/epics` | `my-epics` | Query `browseType`：默认 `allstory` → `assignedTo`，选项更新<br>Query `filters` 说明：增加 `release(所属发布，示例：all)`<br>Query 新增 `param:string`（搜索参数；browseType=bysearch 或 bySearch 时必填。）<br>响应 `epics[].docs` 说明：新增 `相关文档`<br>响应新增 `epics[].cardColor:string`、`epics[].prevReviewers:string`、`epics[].relatedObject:integer` |
| `GET /my/feedbacks` | `my-feedbacks` | Query `browseType`：默认 `all` → `assigntome`，选项更新 |
| `GET /my/issues` | `my-issues` | Query `browseType`：默认 `all` → `assignedTo`，选项更新<br>Query 新增 `param:string`（搜索参数；browseType=bysearch 或 bySearch 时必填。）<br>响应新增 `issues:array<object>`、`pager:Pager` |
| `GET /my/projects` | `my-projects` | Query `browseType`：默认 `all` → `doing`，选项更新<br>响应新增 `projects[].PI:integer` |
| `GET /my/requirements` | `my-requirements` | Query `browseType`：默认 `allstory` → `assignedTo`，选项更新<br>Query `filters` 说明：增加 `release(所属发布，示例：all)`<br>Query 新增 `param:string`（搜索参数；browseType=bysearch 或 bySearch 时必填。）<br>响应 `requirements[].docs` 说明：新增 `相关文档`<br>响应新增 `requirements[].cardColor:string`、`requirements[].prevReviewers:string`、`requirements[].relatedObject:integer` |
| `GET /my/risks` | `my-risks` | Query `browseType`：默认 `all` → `assignedTo`，选项更新<br>Query 新增 `param:string`（搜索参数；browseType=bysearch 或 bySearch 时必填。）<br>响应新增 `pager:Pager`、`risks:array<object>` |
| `GET /my/stories` | `my-stories` | Query `browseType`：默认 `allstory` → `assignedTo`，选项更新<br>Query `filters` 说明：增加 `release(所属发布，示例：all)`<br>Query 新增 `param:string`（搜索参数；browseType=bysearch 或 bySearch 时必填。）<br>响应 `stories[].docs` 说明：新增 `相关文档`<br>响应新增 `stories[].bugCount:integer`、`stories[].cardColor:string`、`stories[].caseCount:integer`、`stories[].prevReviewers:string`、`stories[].relatedObject:integer`、`stories[].taskCount:integer` |
| `GET /my/tasks` | `my-tasks` | Query `browseType`：默认 `all` → `assignedTo`，选项更新<br>Query 新增 `param:string`（搜索参数；browseType=bysearch 或 bySearch 时必填。）<br>响应补全 `tasks[]` 的对象字段定义<br>响应 `tasks[]`：`string` → `object` |
| `GET /my/testcases` | `my-testcases` | Query `browseType`：默认 `all` → `assigntome`，选项更新<br>Query 新增 `param:string`（搜索参数；browseType=bysearch 或 bySearch 时必填。） |
| `GET /my/testtasks` | `my-testtasks` | Query `browseType`：默认 `all` → `assignedTo`，选项更新<br>Query 新增 `param:string`（搜索参数；browseType=bysearch 或 bySearch 时必填。）<br>响应 `testtasks[].begin` 说明：`开始日期` → `计划开始`<br>响应 `testtasks[].end` 说明：`结束日期` → `计划完成`<br>响应 `testtasks[].realBegan` 说明：`实际开始日期` → `实际开始`<br>响应 `testtasks[].realFinishedDate` 说明：`实际完成日期` → `实际完成` |
| `GET /my/tickets` | `my-tickets` | Query `browseType`：默认 `all` → `assignedtome`，选项更新<br>响应新增 `tickets[].consumed:integer` |
| `GET /my/todos` | `my-todos` | Query `browseType`：默认 `all` → `all`，选项更新<br>Query 新增 `status:string`（待办状态；browseType=undone 时传 undone。）<br>响应 schema 移除 `todos[]` 的对象字段定义<br>响应 `todos[]`：`object` → `string` |
| `GET /products/{productID}/epics` | `epic-list` | Query `filters` 说明：增加 `release(所属发布，示例：all)`<br>响应 `epics[].docs` 说明：新增 `相关文档`<br>响应新增 `epics[].cardColor:string`、`epics[].prevReviewers:string` |
| `GET /products/{productID}/requirements` | `requirement-list` | Query `filters` 说明：增加 `release(所属发布，示例：all)`<br>响应 `requirements[].docs` 说明：新增 `相关文档`<br>响应新增 `requirements[].cardColor:string`、`requirements[].prevReviewers:string` |
| `GET /products/{productID}/stories` | `story-list` | Query `filters` 说明：增加 `release(所属发布，示例：all)`<br>响应 `stories[].docs` 说明：新增 `相关文档`<br>响应新增 `stories[].cardColor:string`、`stories[].prevReviewers:string` |
| `GET /projects` | `project-list` | Query `filters` 说明：增加 `teamCount(人数，示例：关键字)`<br>响应 `projects[].PM`：`boolean` → `string`<br>响应 `projects[].PMAvatar`：`boolean` → `string`<br>响应 `projects[].PMUserID` 格式：`int32`<br>响应 `projects[].PMUserID`：`boolean` → `integer`<br>响应 `projects[].progress` 格式：`int32`<br>响应 `projects[].progress`：`string` → `integer`<br>响应新增 `projects[].PI:integer`、`projects[].PMName:string`、`projects[].delay:integer`<br>响应 schema 移除声明 `projects[].desc:string`、`projects[].output:string`、`projects[].schedule:string`、`projects[].tplWhiteList:string`、`projects[].whitelist:string` |
| `GET /projects/{projectID}/stories` | `story-list` | Query `filters` 说明：增加 `release(所属发布，示例：all)`<br>响应 `stories[].docs` 说明：新增 `相关文档`<br>响应新增 `stories[].cardColor:string`、`stories[].prevReviewers:string` |

### 响应契约或字段说明变化（35 个接口）

| HTTP 方法与路径 | SDK action | 变化 |
| --- | --- | --- |
| `GET /bugs/{bugID}` | `bug-get` | 响应 `bug.repo` 说明：`所属版本库` → `所属代码库`<br>响应 `bug.repoType` 说明：`版本库类型` → `代码库类型` |
| `GET /doc/docs/{docID}` | `doc-get` | 响应新增 `doc.versionMarkers:array<string>` |
| `GET /executions` | `execution-list` | 响应新增 `executions[].PI:integer` |
| `GET /executions/team` | `execution-team` | 响应新增 `members[].teamgroup:integer` |
| `GET /executions/{executionID}` | `execution-get` | 响应新增 `execution.PI:integer` |
| `GET /executions/{executionID}/bugs` | `bug-list` | 响应 `bugs[].repo` 说明：`所属版本库` → `所属代码库`<br>响应 `bugs[].repoType` 说明：`版本库类型` → `代码库类型` |
| `GET /executions/{executionID}/builds` | `build-list` | 响应 schema 移除声明 `builds[].bugs:string`、`builds[].desc:string`、`builds[].stories:string` |
| `GET /executions/{executionID}/meetings` | `meeting-executionMeetings` | 响应 schema 移除声明 `meetings[].minutes:string`、`meetings[].participant:string` |
| `GET /executions/{executionID}/members` | `execution-executionMembers` | 响应新增 `members[].teamgroup:integer` |
| `GET /executions/{executionID}/risks` | `risk-executionRisks` | 响应新增 `risks[].PI:integer`、`risks[].team:integer` |
| `GET /executions/{executionID}/tasks` | `task-list` | 响应新增 `tasks[].deliverable:string`、`tasks[].fromDeliverable:integer` |
| `GET /executions/{executionID}/testtasks` | `testtask-list` | 响应 `testtasks[].begin` 说明：`开始日期` → `计划开始`<br>响应 `testtasks[].end` 说明：`结束日期` → `计划完成`<br>响应 `testtasks[].realBegan` 说明：`实际开始日期` → `实际开始`<br>响应 `testtasks[].realFinishedDate` 说明：`实际完成日期` → `实际完成` |
| `GET /meetings` | `meeting-list` | 响应 schema 移除声明 `meetings[].minutes:string`、`meetings[].participant:string` |
| `GET /my/meetings` | `my-meetings` | 响应 schema 移除声明 `meetings[].minutes:string`、`meetings[].participant:string` |
| `GET /products` | `product-list` | 响应 schema 移除声明 `products[].desc:string`、`products[].groups:string`、`products[].reviewer:string`、`products[].whitelist:string` |
| `GET /products/{productID}/bugs` | `bug-list` | 响应 `bugs[].repo` 说明：`所属版本库` → `所属代码库`<br>响应 `bugs[].repoType` 说明：`版本库类型` → `代码库类型` |
| `GET /products/{productID}/testtasks` | `testtask-list` | 响应 `testtasks[].begin` 说明：`开始日期` → `计划开始`<br>响应 `testtasks[].end` 说明：`结束日期` → `计划完成`<br>响应 `testtasks[].realBegan` 说明：`实际开始日期` → `实际开始`<br>响应 `testtasks[].realFinishedDate` 说明：`实际完成日期` → `实际完成` |
| `GET /programs` | `program-list` | 响应新增 `programs[].PI:integer`<br>响应 schema 移除声明 `programs[].desc:string`、`programs[].output:string`、`programs[].schedule:string`、`programs[].tplWhiteList:string`、`programs[].whitelist:string` |
| `GET /programs/{programID}` | `program-get` | 响应新增 `program.PI:integer` |
| `GET /programs/{programID}/products` | `product-programProducts` | 响应 schema 移除声明 `products[].PMT:string`、`products[].desc:string`、`products[].groups:string`、`products[].reviewer:string`、`products[].whitelist:string` |
| `GET /programs/{programID}/projects` | `project-programProjects` | 响应新增 `projects[].PI:integer`、`projects[].delay:integer`<br>响应 schema 移除声明 `projects[].desc:string`、`projects[].output:string`、`projects[].schedule:string`、`projects[].tplWhiteList:string`、`projects[].whitelist:string` |
| `GET /projects/team` | `project-team` | 响应新增 `members[].teamgroup:integer` |
| `GET /projects/{projectID}/bugs` | `bug-list` | 响应 `bugs[].repo` 说明：`所属版本库` → `所属代码库`<br>响应 `bugs[].repoType` 说明：`版本库类型` → `代码库类型` |
| `GET /projects/{projectID}/builds` | `build-list` | 响应 schema 移除声明 `builds[].bugs:string`、`builds[].desc:string`、`builds[].stories:string` |
| `GET /projects/{projectID}/executions` | `execution-projectExecutions` | 响应新增 `executions[].PI:integer` |
| `GET /projects/{projectID}/meetings` | `meeting-projectMeetings` | 响应 schema 移除声明 `meetings[].minutes:string`、`meetings[].participant:string` |
| `GET /projects/{projectID}/members` | `project-projectMembers` | 响应新增 `members[].teamgroup:integer` |
| `GET /projects/{projectID}/risks` | `risk-projectRisks` | 响应新增 `risks[].PI:integer`、`risks[].team:integer` |
| `GET /projects/{projectID}/testtasks` | `testtask-list` | 响应 `testtasks[].begin` 说明：`开始日期` → `计划开始`<br>响应 `testtasks[].end` 说明：`结束日期` → `计划完成`<br>响应 `testtasks[].realBegan` 说明：`实际开始日期` → `实际开始`<br>响应 `testtasks[].realFinishedDate` 说明：`实际完成日期` → `实际完成` |
| `GET /risks` | `risk-list` | 响应新增 `risks[].PI:integer`、`risks[].team:integer` |
| `GET /risks/{riskID}` | `risk-get` | 响应新增 `risk.PI:integer`、`risk.team:integer` |
| `GET /stories/{storyID}` | `story-get` | 响应 `story.docs` 说明：新增 `相关文档`<br>响应新增 `story.cardColor:string`、`story.prevReviewers:string` |
| `GET /users` | `user-list` | 响应 schema 移除声明 `users[].analysis:string`、`users[].avatar:string`、`users[].nature:string`、`users[].strategy:string` |
| `GET /workflow/contract` | `workflow-list` | 响应 schema 移除声明 `dataList[].name:string` |
| `GET /workflow/contract/1` | `workflow-getContract` | 响应 schema 移除声明 `data.name:string` |

### 地盘查询参数迁移速查

`browseType` 的大小写必须按各接口实际取值传入；例如 `assignedTo`、`assigntome`、`assignedtome` 分属不同接口，不能统一替换。

| 接口 | 旧默认 → 新默认 | 当前 browseType 取值 |
| --- | --- | --- |
| `GET /my/bugs` | `all` → `assignedTo` | `assignedTo`、`openedBy`、`resolvedBy`、`closedBy`、`assignedBy`、`bysearch` |
| `GET /my/epics` | `allstory` → `assignedTo` | `all`、`assignedTo`、`openedBy`、`reviewBy`、`reviewedBy`、`closedBy`、`assignedBy`、`bysearch` |
| `GET /my/feedbacks` | `all` → `assigntome` | `assigntome`、`unclosed`、`wait`、`doing`、`toclosed`、`openedbyme`、`reviewedbyme`、`closedbyme`、`assignedbyme` |
| `GET /my/issues` | `all` → `assignedTo` | `assignedTo`、`createdBy`、`resolvedBy`、`closedBy`、`assignedBy`、`bysearch` |
| `GET /my/projects` | `all` → `doing` | `doing`、`wait`、`suspended`、`closed`、`done`、`undone`、`delayed`、`openedbyme`、`all` |
| `GET /my/requirements` | `allstory` → `assignedTo` | `all`、`assignedTo`、`openedBy`、`reviewBy`、`reviewedBy`、`closedBy`、`assignedBy`、`bysearch` |
| `GET /my/risks` | `all` → `assignedTo` | `assignedTo`、`createdBy`、`closedBy`、`assignedBy`、`bysearch` |
| `GET /my/stories` | `allstory` → `assignedTo` | `all`、`assignedTo`、`openedBy`、`reviewBy`、`reviewedBy`、`closedBy`、`assignedBy`、`bysearch` |
| `GET /my/tasks` | `all` → `assignedTo` | `assignedTo`、`openedBy`、`finishedBy`、`myInvolved`、`closedBy`、`canceledBy`、`assignedBy`、`bysearch` |
| `GET /my/testcases` | `all` → `assigntome` | `assigntome`、`openedbyme`、`bysearch` |
| `GET /my/testtasks` | `all` → `assignedTo` | `assignedTo`、`bySearch` |
| `GET /my/tickets` | `all` → `assignedtome` | `assignedtome`、`unclosed`、`wait`、`doing`、`done`、`closed`、`openedbyme`、`finishedbyme`、`closedbyme`、`assignedbyme` |
| `GET /my/todos` | `all` → `all` | `all`、`today`、`thisWeek`、`thisMonth`、`future`、`undone`、`cycle`、`assignedToOther` |

本次另外补齐 11 处原先只在说明中出现、未被 `parameters` 正式声明的查询参数：

- `GET /my/todos` 增加 `status: string`，`browseType=undone` 时传 `status=undone`。
- `GET /my/tasks`、`/my/bugs`、`/my/stories`、`/my/epics`、`/my/requirements`、`/my/testtasks`、`/my/testcases`、`/my/issues`、`/my/risks`、`/my/reviewissues` 增加 `param: string`；按对应接口的 `browseType=bysearch` 或 `bySearch` 执行搜索时必填。
- 这些参数在 schema 中保持可选，因为必填条件取决于 `browseType`；`/my/reviewissues` 本身属于新增接口，其余 10 处归在已有接口变更中。

## 4. SDK 映射和兼容性

### 工作流命名

原有合同接口 `workflow-list`、`workflow-create`、`workflow-update`、`workflow-delete`、`workflow-getContract` 保持原名。新工作流管理使用 `workflow-flows`、`workflow-createFlow`、`workflow-getFlow`、`workflow-updateFlow`、`workflow-deleteFlow`；字段、动作、标签、子表、数据源和规则分别使用 `Field`、`Action`、`Label`、`Table`、`Datasource`、`Rule` 后缀。

4 个子资源列表明确映射为 `workflow-fields`、`workflow-actions`、`workflow-labels`、`workflow-tables`，避免因既有顶层 `list` 而被忽略。工作流和动作的 JS/CSS 设置分别使用 `setFlowJS/setFlowCSS` 与 `setActionJS/setActionCSS`。完整 method/path 对照见新增清单。

### DB 与知识库接口迁移（8 个）

| 接口 / action | 保留与变化 |
| --- | --- |
| `db-tables` | 保留 tables 列表提取和非 JSON 响应错误检测。 |
| `db-table` | OpenAPI 路径变量为 `{tableName}`，SDK 为兼容旧调用继续使用 `table`；保留 `type=meta/sql` 和 `data.table ?? data` 的响应兼容提取。 |
| `db-query` | 保留 POST 列表语义、rows 提取及 page/limit/total 分页映射；请求体增加 `count: boolean`，支持显式传 `false`。 |
| `knowledgelib-list`、`knowledge-list` | 保留 data/pager 提取、查询选项及 pageID=1、recPerPage=20。 |
| `knowledge-embeddingsSearch`、`knowledge-search` | 保留既有请求体约束与默认值；libIDs 继续使用非空正整数数组。OpenAPI 原始 schema 的 string 元素定义与说明/示例不一致，SDK 映射保留原有 integer 定义。 |
| `knowledge-get` | 保留 data 对象提取和原有路径参数。 |

以上 8 个 action 的静态元数据迁至 `scripts/zentao-api-map.json` 并由生成器输出；`override.ts` 仅保留 JSON 响应校验及 DB 表结构的函数式兼容处理。知识库接口最低版本从仅商业系列调整为本次指定的四个系列。

### 结果提取和生成器修复

- `relation-candidates` 提取 `objects` 并保留 `pager`；原始响应的 `relationPairs` 可通过 `raw: true` 读取。
- `resourcecalendar-get` 返回 `resourceCalendars` 对象，保留 type/mode/accounts/projectID/depts 查询参数，不按列表处理。
- 查询参数现在为所有 action 类型生成，避免 `get` 类型的日历和表结构接口丢失 Query。
- 选项解析可以跳过“区分大小写”等说明性括号，再读取真正的选项列表，同时保留嵌套括号标签。
- 数组 / 对象参数保留完整说明，不将 `filters` 内部字段的枚举错误提升为整个参数的 options。
- 13 个 `my-activity*` 接口未声明明确默认筛选值；不传 browseType 时交由服务端处理，不再错误发送 `browseType=值`。说明中的示例 `openedBy` 不被当作默认值。
- `file-create` 继续通过 multipart/form-data 上传，未因注册表更新退化为 JSON。

### scoped-list 合并对照（22 个 operation）

以下 action 按项目、执行或产品范围选择路径。清单中的每个来源 operation 都有对应 scope option；本次新增的 4 组合并单独标明。

| SDK action | 来源 GET operation | 状态 |
| --- | --- | --- |
| `story-list` | `GET /projects/{projectID}/stories`<br>`GET /products/{productID}/stories`<br>`GET /executions/{executionID}/stories` | 已有，继续保留 |
| `bug-list` | `GET /projects/{projectID}/bugs`<br>`GET /products/{productID}/bugs`<br>`GET /executions/{executionID}/bugs` | 已有，继续保留 |
| `testcase-list` | `GET /products/{productID}/testcases`<br>`GET /projects/{projectID}/testcases`<br>`GET /executions/{executionID}/testcases` | 已有，继续保留 |
| `build-list` | `GET /projects/{projectID}/builds`<br>`GET /executions/{executionID}/builds` | 已有，继续保留 |
| `testtask-list` | `GET /products/{productID}/testtasks`<br>`GET /projects/{projectID}/testtasks`<br>`GET /executions/{executionID}/testtasks` | 已有，继续保留 |
| `process-list` | `GET /projects/{projectID}/processes`<br>`GET /executions/{executionID}/processes` | 本次新增 |
| `auditplan-list` | `GET /projects/{projectID}/auditplans`<br>`GET /executions/{executionID}/auditplans` | 本次新增 |
| `nc-list` | `GET /projects/{projectID}/ncs`<br>`GET /executions/{executionID}/ncs` | 本次新增 |
| `opportunity-list` | `GET /projects/{projectID}/opportunities`<br>`GET /executions/{executionID}/opportunities` | 本次新增 |

## 5. 仅示例更新（31 个）

以下 operation 的非示例契约及元数据没有变化。这里只记录接口，不复制响应中的 token、测试数据、日期或长业务样本。

| HTTP 方法与路径 | 用途 |
| --- | --- |
| `GET /doc/libs/{libID}` | 获取文档库详情 |
| `GET /doc/my/spaces/{spaceID}/libs` | 获取我的文档库列表 |
| `GET /doc/product/spaces/{productID}/libs` | 获取产品文档库列表 |
| `GET /doc/project/spaces/{projectID}/libs` | 获取项目文档库列表 |
| `GET /doc/spaces/{spaceID}` | 获取文档空间详情 |
| `GET /doc/team/spaces/{spaceID}/libs` | 获取团队文档库列表 |
| `GET /doc/team/spaces/{spaceID}/libs/{libID}/docs` | 获取团队文档列表 |
| `GET /executions/{executionID}/issues` | 获取执行问题列表 |
| `GET /executions/{executionID}/testcases` | 获取执行测试用例列表 |
| `GET /feedbacks/{feedbackID}` | 获取反馈详情 |
| `GET /issues` | 获取问题列表 |
| `GET /issues/{issueID}` | 获取问题详情 |
| `GET /meetings/{meetingID}` | 获取会议详情 |
| `GET /productplans/{planID}` | 获取产品计划详情 |
| `GET /products/{productID}` | 获取产品详情 |
| `GET /products/{productID}/feedbacks` | 获取产品反馈列表 |
| `GET /products/{productID}/productplans` | 获取产品计划列表 |
| `GET /products/{productID}/releases` | 获取产品发布列表 |
| `GET /products/{productID}/testcases` | 获取产品测试用例列表 |
| `GET /products/{productID}/tickets` | 获取产品工单列表 |
| `GET /projects/{projectID}/issues` | 获取项目问题列表 |
| `GET /projects/{projectID}/testcases` | 获取项目测试用例列表 |
| `GET /testcases/{caseID}` | 获取测试用例详情 |
| `GET /tickets/{ticketID}` | 获取工单详情 |
| `POST /feedbacks/{feedbackID}/todos` | 反馈转待办 |
| `POST /meetings` | 创建会议 |
| `POST /projects/{projectID}/close` | 关闭项目 |
| `POST /systems` | 创建应用 |
| `POST /users/login` | 获取Token |
| `PUT /meetings/{meetingID}` | 修改会议 |
| `PUT /systems/{systemID}` | 修改应用 |

## 6. 验证与使用边界

- `8969b9e` 提交前已通过 `bun run check`：360 项测试、源代码与测试类型检查、注册表一致性与覆盖审计、构建、Node / 浏览器打包 / 包发布内容冒烟检查。
- 整理本文时重新执行 `bun run registry:check` 和 `bun run registry:audit`，结果均通过；367 个非 Token operation 全部有归宿。
- 所有生成 GET action 均有非空结果提取字段；本次以 OpenAPI schema 和既有兼容实现核对，未运行真实环境测试或逐一请求新增接口。
- `/my/todos` 的响应 items 在当前 OpenAPI 中仍声明为 string，示例为空数组，无法据此确认实际元素结构；本文保留上游声明，不将其写成已验证的对象列表。
- 本文是该次同步的静态变更记录，后续接口的实时定义以 OpenAPI 和注册表为准。

复核命令：

```sh
bun run .agents/skills/update-openapi-registry/scripts/report-openapi-changes.ts --base adc731b
bun run registry:check
bun run registry:audit
```

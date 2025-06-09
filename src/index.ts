// src/index.ts
import $ from 'jquery'; //
import { bitable, ITable, IRecordValue, IFieldMeta, FieldType, ToastType, IFieldConfig, ICell } from '@lark-base-open/js-sdk'; //
import './index.scss'; //
import {
  getCleanUrl,                //
  inferFieldTypeFromValue,    //
  getTable,                   //
  FormValues,                 //
  getFormValuesAndValidate,   //
  convertDYComment,           //
  convertXHSComment,          //
  identifyPlatform,
  fillDataTable,
  convertedAuthorAPIData,
  convertVideoBasicToFeishuFormat,
  convertKOLPostData,
  convertFromSeachKWToFeishuFormat,        //
  MediaPlatform               //
} from './helper';
import {
  CommentSchema,
  KeyWordSearchAuthorInfo,
  KeyWordSearchApiDataItem,
  AuthorBasicAPISchema,
  AuthorBasicFormatted,
  VideoBasicApiData,
  VideoBasicFormatted,
  KeyWordSearchFeishuFormattedItem
} from './schema'; //
import './locales/i18n'; // 开启国际化，详情请看README.md


$(async function () { //
  const ui = bitable.ui; // 在顶层作用域获取 ui 对象 //

  // --- 初始化代码 ---
  const [tableList, selection] = await Promise.all([bitable.base.getTableMetaList(), bitable.base.getSelection()]); //
  const optionsHtml = tableList.map(table => { //
    return `<option value="${table.id}">${table.name}</option>`; //
  }).join(''); //
  $('#tableSelect').append(optionsHtml); //
  if (selection && selection.tableId) { //
    $('#tableSelect').val(selection.tableId); //
  }
  // --- 初始化结束 ---

  $('#addRecord').on('click', async function () { //
    console.log('[onClick] 按钮被点击'); //
    $(this).prop('disabled', true).text('执行中...'); //

    await ui.showToast({ toastType: ToastType.info, message: "操作开始，正在处理..." }); //

    let wasTableDynamicallyCreated = false; //
    try { //
      const input_values = getFormValuesAndValidate(); //
      if (!input_values) { //
        return; //
      }
      console.log('[onClick] Input Values:', input_values); //

      let tip = '正在获取【' + input_values.intentSelect + '】数据...';
      await ui.showToast({ toastType: ToastType.info, message: tip }); //
      const apiResponse = await getTableData(input_values); //
      console.log('[onClick] API Response:', apiResponse); //

      if (!apiResponse || !apiResponse.result_data) { //
        console.warn('[onClick] API未返回有效数据 (result_data 为空)。'); //
        await ui.showToast({ toastType: ToastType.warning, message: "API未返回有效数据" }); //
        return; //
      }

      const dataToProcess = Array.isArray(apiResponse.result_data) ? apiResponse.result_data : [apiResponse.result_data]; //
      if (dataToProcess.length === 0 || (dataToProcess.length > 0 && (typeof dataToProcess[0] !== 'object' || dataToProcess[0] === null))) { //
        console.warn('[onClick] 处理后的数据为空或格式不正确。'); //
        await ui.showToast({ toastType: ToastType.warning, message: "未能获取到有效待处理数据" }); //
        return; //
      }
      console.log('[onClick] Data to Process Count:', dataToProcess.length); //

      let title = '';
      let tablePara = {
        "tableOption": input_values.radioCreate ? "create" : "select",
        "tableSelect": input_values.tableSelect,
        "intentSelect": input_values.intentSelect,
      };
      const table = await getTable( //
        tablePara,
        title, //
        apiResponse.platform, //
        input_values.radioCreate ? dataToProcess : undefined //
      );

      if (!table) { //
        console.error('[onClick] 未能获取或创建表格对象。'); //
        return; //
      }
      const tableName = await table.getName(); //
      console.log(`[onClick] 操作表格: "${tableName}" (ID: ${table.id})`); //

      if (input_values.radioCreate) { //
        wasTableDynamicallyCreated = true; //
      }

      await fillDataTable( //
        table, //
        dataToProcess, //
        wasTableDynamicallyCreated //
      );

      if (wasTableDynamicallyCreated) { //
        try { //
          await ui.switchToTable(table.id); //
          console.log(`[onClick] 已切换到新创建的表格: "${tableName}"`); //
        } catch (e) { //
          console.warn(`[onClick] 切换到新表格 "${tableName}" 失败:`, e); //
        }
      }
      console.log('[onClick] 主要操作流程执行完毕。'); //

    } catch (error) { //
      console.error('[onClick] “立即执行”过程中发生顶层错误:', error); //
      await ui.showToast({ toastType: ToastType.error, message: `操作执行失败: ${(error as Error).message}` }); //
    } finally { //
      $('#addRecord').prop('disabled', false).text('立即执行'); //
      console.log('[onClick] 操作流程结束 (finally)。'); //
    }
  });


  async function getTableData(input_values: FormValues) { //
    const ui = bitable.ui; // 在函数内部获取 ui 对象 //
    const intentSelect = input_values.intentSelect; //
    const origin_input = input_values.inputValue; //
    const apiKey = input_values.apiKey; //

    console.log('[getTableData] origin_input is ', origin_input); //
    const input_url = getCleanUrl(origin_input) ?? origin_input; //
    const platform = identifyPlatform(input_url); //

    console.log('[getTableData] input_url is ', input_url, platform); //

    let headers = { //
      'Content-Type': 'application/json', //
      'Authorization': apiKey,
      'x-source': 'feishu-side-bar',
      'x-app-id': 'get-info-by-url-from-feishu-side-bar',
      'x-user-uuid': 'user-123456',
      // 可选的用户昵称
      // 'x-user-nickname': '用户昵称',
      // 添加所有上下文信息到请求头
      // 'x-base-signature': contextInfo.baseSignature || '',
      // 'x-base-id': contextInfo.baseID || '',
      // 'x-log-id': contextInfo.logID || '',
      // 'x-table-id': contextInfo.tableID || '',
      // 'x-pack-id': contextInfo.packID || '',
      // 'x-tenant-key': contextInfo.tenantKey || '',
      // 'x-time-zone': contextInfo.timeZone || '',
      // 'x-base-owner-id': contextInfo.baseOwnerID || ''
    };

    // const activeDomain = 'http://localhost:8083'; //
    const activeDomain = 'http://42.192.40.44:8083'
    const host_base = activeDomain.startsWith('http') ? activeDomain : `http://${activeDomain}`; //

    let result_data_from_api; //
    switch (intentSelect) { //
      case '基础文案': //
        result_data_from_api = await getVideoBasic(host_base, input_url, headers); //
        break; //
      case '视频趋势': //
        result_data_from_api = await getVideoTrend(host_base, input_url, headers); //
        break; //
      case '评论': //
        result_data_from_api = await getVideoComment(host_base, input_url, headers, platform); //
        break; //
      case '关键字': //
        result_data_from_api = await getKeywordsSearch(host_base, input_url, headers); //
        break; //
      case '作者':  //
        result_data_from_api = await getKOLBasic(host_base, input_url, headers); //
        break; //
      case '作品集':  //
        result_data_from_api = await getKOLPosts(host_base, input_url, headers); //
        break; //
      case '作者趋势': //
        result_data_from_api = await getKOLTrends(host_base, input_url, headers); //
        break; //
      default: //
        await ui.showToast({ toastType: ToastType.warning, message: `未选择或不支持的数据意图: ${intentSelect}` }); //
        return { result_data: null, platform }; //
    }

    return { result_data: result_data_from_api, platform }; //
  }


  async function getVideoBasic(host_base: string, inputValue: string, headers: any): Promise<VideoBasicFormatted | null> { // 更新函数返回类型
    const ui = bitable.ui; // 获取ui对象 //
    const comment_api_path = '/api/media/extract/sd';  //
    const full_api_path = `${host_base}${comment_api_path}`; //

    try { //
      console.log(`[getVideoBasic] Fetching from: ${full_api_path} with URL: ${inputValue}`); //
      const response = await fetch(full_api_path, { //
        method: 'POST', //
        headers: headers, //
        body: JSON.stringify({
          url: inputValue,
          extract_text: true, // Pass the flag to the API
          include_comments: false
        })  //
      });

      if (!response.ok) { //
        const errorText = await response.text(); //
        console.error(`[getVideoBasic] HTTP error! status: ${response.status}`, errorText); //
        await ui.showToast({ toastType: ToastType.error, message: `API请求错误 ${response.status}: ${errorText.substring(0, 100)}` }); // 截断过长的错误信息
        return null; //
      }

      const res = await response.json();
      if (res.code == 402) {
        //
        console.error('[getVideoBasic] API 访问被限制:', res.message);
        await ui.showToast({ toastType: ToastType.error, message: `API 访问被限制: ${res.message}` });
        return null;
      }


      if (res.code === 202 && res.task_id) {
        const taskId = res.task_id;
        const root_trace_key = res.root_trace_key; //

        const maxAttempts = 30;
        const pollInterval = 20 * 1000; // 20 seconds, 原注释是10秒，代码是20秒
        let attempts = 0;
        let taskComplete = false;
        let finalDataFromPolling = null; // Use a separate variable inside the polling scope
        const status_api_path_base = '/api/media/extract/sd/status/';

        // headers['x-root-trace-key'] = root_trace_key; // 注意：直接修改传入的 headers 对象可能影响外部调用
        // 最好创建一个新的 headers 对象或确保这是期望的行为
        let pollingHeaders = { ...headers, 'x-root-trace-key': root_trace_key };
        while (attempts < maxAttempts && !taskComplete) {
          attempts++;
          // 在实际应用中，这里可能需要一个延时函数，例如 await new Promise(resolve => setTimeout(resolve, pollInterval));
          // 如果是第一个attempt，可能不需要延时，或者延时策略更复杂。为简化，此处省略延时。
          // 但实际轮询必须有延时，否则会立即耗尽尝试次数。
          // 假设延时已在其他地方处理或此处暂时省略。在实际代码中，请确保添加延时：
          if (attempts > 1) { // 从第二次尝试开始等待
             await new Promise(resolve => setTimeout(resolve, pollInterval));
          }
          console.log(`taskid -- ${taskId} 开始轮询任务执行状态----Polling status API, attempt ${attempts}/${maxAttempts}`);

          let isBreak = false
          try {
            const statusResponse = await fetch(`${host_base}${status_api_path_base}${taskId}`, {
              method: 'GET',
              headers: pollingHeaders, // 使用带有 trace key 的 headers
            });

            if (!statusResponse.ok) {
              const errorText = await statusResponse.text();
              console.log(`taskid -- ${taskId} 记录任务的状态----Status API call failed (attempt ${attempts}, non-OK status)`, { status: statusResponse.status, text: errorText });
              if (attempts === maxAttempts) throw new Error(`状态查询失败 (尝试 ${attempts} 次): ${statusResponse.status} ${errorText}`);
              continue; // Try polling again
            }

            const statusRes = await statusResponse.json();
            console.log(`taskid -- ${taskId} 记录任务的状态 ---Status API response (attempt ${attempts})`, { statusRes });

            if (statusRes.code === 200 && statusRes.data && statusRes.status === 'completed') {
              finalDataFromPolling = statusRes.data; // 这是API返回的原始成功数据
              taskComplete = true;
              console.log(`taskid -- ${taskId} 循环获取任务成功了  ---Task completed successfully via polling!`, { statusRes });

              // ----- BEGIN TODO COMPLETION -----
              // orign_result 的构建逻辑已经存在，现在我们使用 finalDataFromPolling (即 statusRes.data)
              const mediaData = finalDataFromPolling; // mediaData 就是轮询成功后 statusRes.data

              if (!mediaData) {
                // 这个检查其实在 taskComplete = true 后，finalDataFromPolling 应该有值
                console.log('循环获取任务成功但mediaData为空 ---Critical Error: mediaData is null after successful poll');
                throw new Error('任务轮询成功，但未能获取有效媒体数据。');
              }

              let tagsStr = '';
              if (mediaData.tags && Array.isArray(mediaData.tags)) {
                tagsStr = mediaData.tags.join(', ');
              } else if (typeof mediaData.tags === 'string') { // API有时可能直接返回字符串
                tagsStr = mediaData.tags;
              }
              
              // 创建符合 VideoBasicApiData 接口的对象
              const orign_result: VideoBasicApiData = {
                title: mediaData.title || '无标题',
                authorName: mediaData.author?.nickname || mediaData.author_name || '未知作者',
                description: mediaData.description || '',
                // publishTime 需要是ISO字符串或时间戳数字，new Date() 可以处理多种格式
                // 如果 mediaData.publish_time 是时间戳数字，可以直接用；如果是字符串，new Date() 会解析
                publishTime: mediaData.publish_time ? new Date(mediaData.publish_time).toISOString() : null,
                likeCount: mediaData.statistics?.like_count ?? mediaData.like_count ?? 0,
                collectCount: mediaData.statistics?.collect_count ?? mediaData.collect_count ?? 0,
                shareCount: mediaData.statistics?.share_count ?? mediaData.share_count ?? 0, // 修正: mediaData
                commentCount: mediaData.statistics?.comment_count ?? mediaData.comment_count ?? 0,
                tags: tagsStr,
                coverUrl: mediaData.media?.cover_url ?? mediaData.cover_url ?? '',
                videoUrl: mediaData.media?.video_url ?? mediaData.video_url ?? '',
                content: mediaData.content || '',
              };

              // 将 orign_result 结构转变成多维表格的展示结构
              const feishuFormattedData = convertVideoBasicToFeishuFormat(orign_result);
              console.log(`taskid -- ${taskId} 数据转换完成，准备返回`, { feishuFormattedData });
              return feishuFormattedData; // <--- 从函数成功返回转换后的数据
              // ----- END TODO COMPLETION -----

            } else if (statusRes.code == 500 && statusRes.status === 'failed') {
              console.log(` taskid -- ${taskId} 任务返回失败----Task failed at attempt ${attempts}`, { statusRes });
              isBreak = true
              throw new Error(`任务返回失败: ${statusRes.message}`);
            } else if ((statusRes.status === 'running' || statusRes.code !== 200) && attempts < maxAttempts) {
              console.log(`taskid -- ${taskId} 循环获取任务需要继续----Task still processing (attempt ${attempts})`);
            } else { 
              console.log(`taskid -- ${taskId} 循环获取任务失败----Task failed or polling timed out (attempt ${attempts})`, { statusRes });
              throw new Error(`获取结果失败: ${statusRes.message || '任务处理超时或失败'}`);
            }
            // 移除原先在成功分支外的 finalDataFromPolling 和 mediaData 的处理，因为成功时已return
          } catch (error) {
            console.log(`taskid -- ${taskId} 循环获取任务异常----Error during status poll (attempt ${attempts})`, { error: error });
            if (attempts === maxAttempts) throw error; // Rethrow if max attempts reached
            if (isBreak) throw error; // 如果是任务明确失败，则立即抛出
          }
        } // end of while loop

        // 如果循环结束仍未完成任务 (例如, 达到 maxAttempts 但任务仍在运行或未明确成功/失败)
        if (!taskComplete) {
            console.log(`taskid -- ${taskId} 轮询结束但任务未完成。`);
            throw new Error('无法在规定时间内获取到媒体信息 (Polling timed out or task not completed)');
        }
        // 如果 taskComplete 为 true，但由于某种原因没有在循环内 return (理论上不应该发生，因为成功路径会 return)
        // 这里可以再加一个保障性的 return null 或抛错
        return null;


      } else { // Initial request failed or didn't return task_id when expected
        console.log(' 没有拿到服务端返回的任务号---Error: Polling required but task_id not received or initial error', { res });
        // 如果 res.data 里面直接有数据 (非轮询模式)
        if (res.code === 200 && res.data) {
            console.log('[getVideoBasic] API直接返回数据 (非轮询模式)', res.data);
            const mediaData = res.data;
            let tagsStr = '';
            if (mediaData.tags && Array.isArray(mediaData.tags)) {
                tagsStr = mediaData.tags.join(', ');
            } else if (typeof mediaData.tags === 'string') {
                tagsStr = mediaData.tags;
            }

            const orign_result: VideoBasicApiData = {
                title: mediaData.title || '无标题',
                authorName: mediaData.author?.nickname || mediaData.author_name || '未知作者',
                description: mediaData.description || '',
                publishTime: mediaData.publish_time ? new Date(mediaData.publish_time).toISOString() : null,
                likeCount: mediaData.statistics?.like_count ?? mediaData.like_count ?? 0,
                collectCount: mediaData.statistics?.collect_count ?? mediaData.collect_count ?? 0,
                shareCount: mediaData.statistics?.share_count ?? mediaData.share_count ?? 0,
                commentCount: mediaData.statistics?.comment_count ?? mediaData.comment_count ?? 0,
                tags: tagsStr,
                coverUrl: mediaData.media?.cover_url ?? mediaData.cover_url ?? '',
                videoUrl: mediaData.media?.video_url ?? mediaData.video_url ?? '',
                content: mediaData.content || '',
            };
            const feishuFormattedData = convertVideoBasicToFeishuFormat(orign_result);
            return feishuFormattedData;
        }
        throw new Error(`API 错误: ${res.message || '无效的初始响应或非成功状态码'}`);
      }
    } catch (error) { 
      console.error('[getVideoBasic] 获取视频基础信息时发生顶层错误:', error); // 修改了日志的上下文
      await ui.showToast({ toastType: ToastType.error, message: `获取视频基础数据失败: ${(error as Error).message.substring(0, 100)}` });
      return null; 
    }
  }



  async function getKOLPosts(host_base: string, inputValue: string, headers: any) { //
    const ui = bitable.ui; // 获取ui对象 //
    const api_path = '/api/tt/kol';  //
    const full_api_path = `${host_base}${api_path}`; //

    try { //
      console.log(`[getKOLPosts] Fetching from: ${full_api_path} with URL: ${inputValue}`); //
      const response = await fetch(full_api_path, { //
        method: 'POST', //
        headers: headers, //
        body: JSON.stringify({ url: inputValue })  //
      });

      if (!response.ok) { //
        const errorText = await response.text(); //
        console.error(`[getKOLPosts] HTTP error! status: ${response.status}`, errorText); //
        await ui.showToast({ toastType: ToastType.error, message: `API请求错误 ${response.status}: ${errorText.substring(0, 100)}` }); // 截断过长的错误信息
        return null; //
      }

      const data = await response.json(); //
      console.log('[getKOLPosts] Raw API Response:', data); //

      const origin_list = data?.data; //
      if (origin_list && Array.isArray(origin_list)) { //
        let convertedCommentData = convertKOLPostData(origin_list);
        
        return convertedCommentData; //
      } else { //
        console.warn('[getKOLPosts] list not found or not an array in API response.'); //
        await ui.showToast({ toastType: ToastType.warning, message: 'API未返回有效的列表' }); //
        return null; //
      }
    } catch (error) { //
      console.error('[getKOLPosts] Error fetching or processing kol', error); //
      await ui.showToast({ toastType: ToastType.error, message: `获取发布作品数据失败: ${(error as Error).message.substring(0, 100)}` }); // 截断过长的错误信息 //
      return null; //
    }
  }

  async function getVideoTrend(host_base: string, inputValue: string, headers: any) { //
    return null; //
  }

  async function getKOLTrends(host_base: string, inputValue: string, headers: any) { //
    return null; //
  }



  async function getVideoComment(host_base: string, inputValue: string, headers: any, platformParam: MediaPlatform | undefined) { //
    const ui = bitable.ui; // 获取ui对象 //
    const comment_api_path = '/api/tt/vcl';  //
    const full_api_path = `${host_base}${comment_api_path}`; //

    try { //
      console.log(`[getVideoComment] Fetching from: ${full_api_path} with URL: ${inputValue}`); //
      const response = await fetch(full_api_path, { //
        method: 'POST', //
        headers: headers, //
        body: JSON.stringify({ url: inputValue })  //
      });

      if (!response.ok) { //
        const errorText = await response.text(); //
        console.error(`[getVideoComment] HTTP error! status: ${response.status}`, errorText); //
        await ui.showToast({ toastType: ToastType.error, message: `API请求错误 ${response.status}: ${errorText.substring(0, 100)}` }); // 截断过长的错误信息
        return null; //
      }

      const data = await response.json(); //
      console.log('[getVideoComment] Raw API Response:', data); //

      const origin_commentsList = data?.data?.comments; //
      const apiPlatform = data?.data?.platform as MediaPlatform;  //

      if (origin_commentsList && Array.isArray(origin_commentsList)) { //
        let convertedCommentData; //
        const platformToUse = apiPlatform || platformParam; //

        if (platformToUse === MediaPlatform.DOUYIN) { //
          convertedCommentData = convertDYComment(origin_commentsList); //
        } else if (platformToUse === MediaPlatform.XIAOHONGSHU) { //
          convertedCommentData = convertXHSComment(origin_commentsList); //
        } else { //
          console.warn(`[getVideoComment] Unknown or unhandled platform: ${platformToUse}`); //
          await ui.showToast({ toastType: ToastType.warning, message: `评论转换暂不支持平台: ${platformToUse}` }); //
          convertedCommentData = origin_commentsList;  //
        }
        console.log('[getVideoComment] Converted Comment Data:', convertedCommentData); //
        return convertedCommentData; //
      } else { //
        console.warn('[getVideoComment] Comments list not found or not an array in API response.'); //
        await ui.showToast({ toastType: ToastType.warning, message: 'API未返回有效的评论列表' }); //
        return null; //
      }
    } catch (error) { //
      console.error('[getVideoComment] Error fetching or processing video comments:', error); //
      await ui.showToast({ toastType: ToastType.error, message: `获取评论数据失败: ${(error as Error).message.substring(0, 100)}` }); // 截断过长的错误信息 //
      return null; //
    }
  }

  async function getKeywordsSearch(host_base: string, inputValue: string, headers: any) { //
    const ui = bitable.ui; // 获取ui对象 //
    const comment_api_path = '/api/tt/sn';  //
    const full_api_path = `${host_base}${comment_api_path}`; //

    const searchPlatSelectElement = document.getElementById('searchPlatSelect') as HTMLSelectElement | null; //
    const platformParam = searchPlatSelectElement ? searchPlatSelectElement.value : "";

    try { //
      console.log(`[getKeywordsSearch] Fetching from: ${full_api_path} with URL: ${inputValue}`); //
      const response = await fetch(full_api_path, { //
        method: 'POST', //
        headers: headers, //
        body: JSON.stringify({
          query: inputValue,
          // platform  : "douyin"
          platform: platformParam
        })  //
      });

      if (!response.ok) { //
        const errorText = await response.text(); //
        console.error(`[getKeywordsSearch] HTTP error! status: ${response.status}`, errorText); //
        await ui.showToast({ toastType: ToastType.error, message: `API请求错误 ${response.status}: ${errorText.substring(0, 100)}` }); // 截断过长的错误信息
        return null; //
      }

      const data = await response.json(); //
      console.log('[getKeywordsSearch] Raw API Response:', data); //

      const origin_commentsList = data?.data; //
      if (origin_commentsList && Array.isArray(origin_commentsList)) { //
        // let convertedCommentData = origin_commentsList; //
        // const platformToUse = apiPlatform || platformParam; //
        const convertedCommentData = convertFromSeachKWToFeishuFormat(origin_commentsList);

        //再来个排序，按照播放数，点赞数 ，倒排
        convertedCommentData.sort((a, b) => { //
          const aPlayCount = a.播放数 || 0; //
          const bPlayCount = b.播放数 || 0; //
          const aLikeCount = a.点赞数 || 0; //
          const bLikeCount = b.点赞数 || 0; //
          return bPlayCount - aPlayCount || bLikeCount - aLikeCount; //
        });
        // convertedCommentData.sort((a, b) => b.播放数 - a.播放数);

        console.log('[getKeywordsSearch] Converted Data:', convertedCommentData); //
        return convertedCommentData; //
      } else { //
        console.warn('[getKeywordsSearch] list not found or not an array in API response.'); //
        await ui.showToast({ toastType: ToastType.warning, message: 'API未返回有效的评论列表' }); //
        return null; //
      }
    } catch (error) { //
      console.error('[getKeywordsSearch] Error fetching or processing video data:', error); //
      await ui.showToast({ toastType: ToastType.error, message: `获取数据失败: ${(error as Error).message.substring(0, 100)}` }); // 截断过长的错误信息 //
      return null; //
    }
  }


  async function getKOLBasic(host_base: string, inputValue: string, headers: any) { //
    const ui = bitable.ui; // 获取ui对象 //
    const comment_api_path = '/api/tt/upro';  //
    const full_api_path = `${host_base}${comment_api_path}`; //

    try { //
      console.log(`[getKOLBasic] Fetching from: ${full_api_path} with URL: ${inputValue}`); //
      const response = await fetch(full_api_path, { //
        method: 'POST', //
        headers: headers, //
        body: JSON.stringify({
          url: inputValue,
          // platform  : "douyin"
          // platform : platformParam 
        })  //
      });

      if (!response.ok) { //
        const errorText = await response.text(); //
        console.error(`[getKOLBasic] HTTP error! status: ${response.status}`, errorText); //
        await ui.showToast({ toastType: ToastType.error, message: `API请求错误 ${response.status}: ${errorText.substring(0, 100)}` }); // 截断过长的错误信息
        return null; //
      }

      const data = await response.json(); //
      console.log('[getKOLBasic] Raw API Response:', data); //

      const origin_author = data?.data; //
      if (origin_author) {
        const convertedAuthorData = convertedAuthorAPIData(origin_author);
        if (convertedAuthorData) {
          console.log('[getKOLBasic] Converted Data:', convertedAuthorData);
          // 这个函数预期返回转换后的单个作者对象。
          // 如果调用方 (如之前的 onClick 中的 dataToProcess) 期望一个数组，
          // 那么调用方需要将这个结果包装在数组中: [convertedAuthorData]
          return convertedAuthorData;
        } else {
          console.warn('[getKOLBasic] Failed to convert author data.');
          await ui.showToast({ toastType: ToastType.warning, message: '未能转换有效的作者信息' });
          return null;
        }
      } else { //
        console.warn('[getKOLBasic] list not found or not an array in API response.'); //
        await ui.showToast({ toastType: ToastType.warning, message: 'API未返回有效的评论列表' }); //
        return null; //
      }
    } catch (error) { //
      console.error('[getKOLBasic] Error fetching or processing video data:', error); //
      await ui.showToast({ toastType: ToastType.error, message: `获取数据失败: ${(error as Error).message.substring(0, 100)}` }); // 截断过长的错误信息 //
      return null; //
    }
  }



}); //
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI, SchemaType, type Tool } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'create_project',
        description: 'プロジェクトを新規作成する',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING, description: 'プロジェクト名' },
            description: { type: SchemaType.STRING, description: '説明' },
            status: { type: SchemaType.STRING, description: 'ステータス: 提案（未定）/提案（高）/制作中/納品済' },
          },
          required: ['name'],
        },
      },
      {
        name: 'list_projects',
        description: 'プロジェクト一覧を取得する',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            status: { type: SchemaType.STRING, description: 'ステータスでフィルタ' },
            sort_by: { type: SchemaType.STRING, description: 'ソート基準: created_at/name/nearest_due' },
          },
        },
      },
      {
        name: 'update_project',
        description: 'プロジェクトを更新する',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'プロジェクトID' },
            project_name: { type: SchemaType.STRING, description: 'プロジェクト名（ID不明時に名前で検索）' },
            name: { type: SchemaType.STRING, description: '新しいプロジェクト名' },
            description: { type: SchemaType.STRING, description: '新しい説明' },
            status: { type: SchemaType.STRING, description: '新しいステータス' },
          },
        },
      },
      {
        name: 'delete_project',
        description: 'プロジェクトを削除する',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'プロジェクトID' },
            project_name: { type: SchemaType.STRING, description: 'プロジェクト名（ID不明時）' },
          },
        },
      },
      {
        name: 'create_task',
        description: 'タスクを新規作成する',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'プロジェクトID' },
            project_name: { type: SchemaType.STRING, description: 'プロジェクト名（ID不明時）' },
            title: { type: SchemaType.STRING, description: 'タスクタイトル' },
            description: { type: SchemaType.STRING, description: '説明' },
            priority: { type: SchemaType.STRING, description: '優先度: 高/中/低' },
            due_date: { type: SchemaType.STRING, description: '締切日 (YYYY-MM-DD)' },
            status: { type: SchemaType.STRING, description: 'ステータス: 未着手/進行中/レビュー中/完了' },
          },
          required: ['title'],
        },
      },
      {
        name: 'update_task',
        description: 'タスクを更新する',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            task_id: { type: SchemaType.STRING, description: 'タスクID' },
            task_title: { type: SchemaType.STRING, description: 'タスクタイトル（ID不明時に名前で検索）' },
            title: { type: SchemaType.STRING, description: '新しいタイトル' },
            description: { type: SchemaType.STRING, description: '新しい説明' },
            status: { type: SchemaType.STRING, description: '新しいステータス' },
            priority: { type: SchemaType.STRING, description: '新しい優先度' },
            due_date: { type: SchemaType.STRING, description: '新しい締切日 (YYYY-MM-DD)' },
          },
        },
      },
      {
        name: 'delete_task',
        description: 'タスクを削除する',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            task_id: { type: SchemaType.STRING, description: 'タスクID' },
            task_title: { type: SchemaType.STRING, description: 'タスクタイトル（ID不明時）' },
          },
        },
      },
      {
        name: 'list_tasks',
        description: 'タスク一覧を取得する',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            project_id: { type: SchemaType.STRING, description: 'プロジェクトID' },
            project_name: { type: SchemaType.STRING, description: 'プロジェクト名' },
            status: { type: SchemaType.STRING, description: 'ステータスでフィルタ' },
            priority: { type: SchemaType.STRING, description: '優先度でフィルタ' },
            sort_by: { type: SchemaType.STRING, description: 'ソート基準: due_date/priority/status/created_at' },
          },
        },
      },
      {
        name: 'add_task_link',
        description: 'タスクに関連リンクを追加する',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            task_id: { type: SchemaType.STRING, description: 'タスクID' },
            task_title: { type: SchemaType.STRING, description: 'タスクタイトル（ID不明時）' },
            url: { type: SchemaType.STRING, description: 'リンクURL' },
            label: { type: SchemaType.STRING, description: 'リンクのラベル' },
          },
          required: ['url'],
        },
      },
      {
        name: 'navigate',
        description: 'ユーザーを指定されたページに遷移させる。「タスクを表示して」「タスクリスト」「ダッシュボード見せて」「設定画面」「今日のタスク」「今週のタスク」などの表示・遷移リクエストに使う',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            page: { type: SchemaType.STRING, description: 'ページ名: dashboard/tasks/settings' },
            project_id: { type: SchemaType.STRING, description: 'プロジェクトIDでタスクをフィルタする場合' },
            project_name: { type: SchemaType.STRING, description: 'プロジェクト名でタスクをフィルタする場合（ID不明時）' },
            date_filter: { type: SchemaType.STRING, description: '日付フィルタ: today（今日のタスク）/ week（今週のタスク）' },
          },
          required: ['page'],
        },
      },
      {
        name: 'update_settings',
        description: 'アプリの表示設定を変更する。「完了を表示して」「完了を非表示にして」「完了タスクを隠して」などに使う',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            show_completed: { type: SchemaType.BOOLEAN, description: '完了タスクを表示するか（true=表示/false=非表示）' },
            show_delivered: { type: SchemaType.BOOLEAN, description: '納品済プロジェクトを表示するか（true=表示/false=非表示）' },
            task_view: { type: SchemaType.STRING, description: 'タスクの表示形式: list（リスト表示）/ calendar（カレンダー表示）' },
          },
        },
      },
    ],
  },
];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { message, history, currentProjectId, contextProjectName, numberMapping } = await request.json();


  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'メッセージが必要です' }, { status: 400 });
  }

  // 会話履歴をGemini API形式に変換
  const chatHistory = (history || []).map((msg: { role: 'user' | 'model'; content: string }) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  // ユーザーの現在のチームを取得
  const { data: profile } = await supabase
    .from('users')
    .select('current_team_id')
    .eq('id', user.id)
    .single();

  const teamId = profile?.current_team_id;
  if (!teamId) {
    return NextResponse.json({ error: 'チームが設定されていません' }, { status: 400 });
  }

  // 現在のプロジェクトコンテキストを構築（URL表示中 or 会話コンテキスト）
  let currentProjectContext = '';
  if (currentProjectId) {
    const { data: currentProject } = await supabase
      .from('projects')
      .select('name')
      .eq('id', currentProjectId)
      .single();
    if (currentProject) {
      currentProjectContext = `\n- 【重要】現在のプロジェクト: ${currentProject.name}（ID: ${currentProjectId}）
  → プロジェクト名の指定がない操作は、必ずこのプロジェクトに対して実行してください。確認の質問は不要です。
  → project_idに「${currentProjectId}」を、project_nameに「${currentProject.name}」を使用してください。`;
    }
  } else if (contextProjectName) {
    currentProjectContext = `\n- 【重要】会話中のプロジェクト: ${contextProjectName}
  → プロジェクト名の指定がない操作は、必ずこのプロジェクトに対して実行してください。確認の質問は不要です。
  → project_nameに「${contextProjectName}」を使用してください。
  → ユーザーが別のプロジェクト名を明示的に指定した場合のみ、そちらに切り替えてください。`;
  }

  // ナンバーマッピングをシステムプロンプト用にフォーマット
  let numberMappingContext = '';
  if (numberMapping?.tasks?.length > 0) {
    const taskList = numberMapping.tasks
      .map((t: { number: number; id: string; title: string; projectName: string }) =>
        `  ${t.number}: 「${t.title}」(ID: ${t.id}, プロジェクト: ${t.projectName})`
      )
      .join('\n');
    numberMappingContext = `\n\n## 現在画面に表示されているタスク番号
ユーザーが番号で指定した場合（例:「1を完了にして」「3の期限を変更」）、以下の対応表からtask_idを特定してください。
${taskList}`;
  }

  const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];

  const systemInstruction = `あなたはAIタスク管理アシスタントです。

【最重要ルール】
1. 会話履歴のメッセージは既に処理済み。現在のメッセージのみを処理せよ。履歴内の操作を再実行してはならない。
2. プロジェクト・タスクの作成・更新・削除・一覧取得は、必ずFunction Callを実行せよ。テキスト応答のみで完了してはならない。
3. ユーザーにIDを質問することは禁止。プロジェクト名・タスク名が分かれば、project_name/task_titleパラメータを使用せよ。DB側であいまい検索する。
4. 現在のプロジェクトが設定されている場合、プロジェクト指定なしの操作はそのプロジェクトに対して実行せよ。確認不要。

コンテキスト: user=${user.id} team=${teamId} today=${new Date().toISOString().split('T')[0]}${currentProjectContext}

【Function Call必須の操作】
- 「○○を追加/作成」→ create_project または create_task
- 「○○を削除」→ delete_project または delete_task
- 「○○を更新/変更/完了に」→ update_project または update_task
- 「○○一覧」→ list_projects または list_tasks
- 「○○を表示/見せて」→ navigate

【パラメータ使用ルール】
- IDが不明な場合: project_id/task_idは空にし、project_name/task_titleに名前を設定
- プロジェクトコンテキストがある場合: project_idにそのIDを使用
- ユーザーが名前で指定した場合: project_name/task_titleにそのまま渡す

ステータス変換: 提案/提案中→提案（未定）, 受注確度高/ほぼ確定→提案（高）, 制作中/進行中/作業中→制作中, 納品済/納品した→納品済

日付変換(必ずYYYY-MM-DD形式に変換してdue_dateに渡す。形式を聞き返さない):
- 4/14, 4.14, 4-14, 4月14日 → YYYY-04-14
- 年省略時: 今日以降の直近日付を採用
- 来週中→次の金曜, 今週中→今週金曜, 明日→翌日, 月末→今月最終日
- 「○日後」「○週間後」→計算して日付化

タスク判定: 「今〜中」「〜待ち」→期限なし(status=進行中), 「急ぎ」「至急」→priority=高

結果報告: 簡潔な日本語で報告。ID・コードは出力しない。${numberMappingContext}`;

  try {
  // モデルをフォールバック付きで試行
  let lastError: unknown = null;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        tools,
      });

      const chat = model.startChat({ history: chatHistory });
      let result = await chat.sendMessage(message);
      let response = result.response;

      // Function Callがなくなるまでループ（複合操作・連鎖対応）
      let navigateUrl: string | null = null;
      let contextProject: { id: string; name: string } | null = null;
      let settingsUpdate: Record<string, boolean | string> | null = null;
      const maxIterations = 5;
      for (let i = 0; i < maxIterations; i++) {
        const functionCalls = response.functionCalls();
        if (!functionCalls || functionCalls.length === 0) break;
        const functionResponses = [];
        for (const fc of functionCalls) {
          const execResult = await executeFunction(supabase, user.id, teamId, fc.name, fc.args || {});
          if (fc.name === 'navigate' && execResult.url) {
            navigateUrl = execResult.url;
          }
          // 操作したプロジェクト情報を保持
          if (execResult.contextProject) {
            contextProject = execResult.contextProject;
          }
          if (execResult.settingsUpdate) {
            settingsUpdate = execResult.settingsUpdate;
          }
          functionResponses.push({
            name: fc.name,
            response: execResult,
          });
        }

        result = await chat.sendMessage(
          functionResponses.map((fr) => ({
            functionResponse: {
              name: fr.name,
              response: fr.response,
            },
          }))
        );
        response = result.response;
      }

      // response.text()が空の場合はフォールバックメッセージを使用
      const replyText = response.text() || '処理が完了しました。';
      return NextResponse.json({
        reply: replyText,
        ...(navigateUrl && { navigateUrl }),
        ...(contextProject && { contextProject }),
        ...(settingsUpdate && { settingsUpdate }),
      });
    } catch (error) {
      lastError = error;
      const errMsg = error instanceof Error ? error.message : String(error);
      // 503/429なら次のモデルを試す、それ以外はすぐエラー
      if (errMsg.includes('503') || errMsg.includes('429') || errMsg.includes('overloaded')) {
        console.warn(`Model ${modelName} unavailable, trying fallback...`);
        continue;
      }
      throw error;
    }
  }

  // 全モデル失敗
  console.error('All models failed:', lastError);
  const lastErrMsg = lastError instanceof Error ? lastError.message : String(lastError);
  return NextResponse.json({ error: `AIの応答に失敗しました: ${lastErrMsg}` }, { status: 500 });
  } catch (error) {
    console.error('Chat API error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `AIの応答に失敗しました: ${errMsg}` }, { status: 500 });
  }
}

// あいまい一致スコア: searchの各文字がtarget内に順序通り含まれるか + 共通文字数
function fuzzyScore(target: string, search: string): number {
  const tLower = target.toLowerCase();
  const sLower = search.toLowerCase();

  // 完全一致
  if (tLower === sLower) return 10000;
  // 部分一致（含まれている）
  if (tLower.includes(sLower)) return 5000 + (1000 - target.length);

  // 各文字が順序通りに含まれるか（「テスト２」→「テストプロジェクト２」）
  let si = 0;
  for (let ti = 0; ti < tLower.length && si < sLower.length; ti++) {
    if (tLower[ti] === sLower[si]) si++;
  }
  if (si === sLower.length) return 3000 + (1000 - target.length);

  // 共通文字数ベースのスコア（漢字⇔ひらがな対応用）
  // 検索文字列を2文字ずつのbigramに分割し、ターゲットに含まれるbigramの数でスコア
  let bigramHits = 0;
  for (let i = 0; i < sLower.length - 1; i++) {
    const bigram = sLower.slice(i, i + 2);
    if (tLower.includes(bigram)) bigramHits++;
  }
  if (bigramHits > 0) return bigramHits * 100 + (1000 - target.length);

  // 1文字単位の共通文字数
  let charHits = 0;
  for (const c of sLower) {
    if (tLower.includes(c)) charHits++;
  }
  // 半分以上の文字が一致していればスコアを付ける
  if (charHits >= sLower.length * 0.5) return charHits * 10 + (1000 - target.length);

  return 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fuzzyFindProject(supabase: any, teamId: string, searchName: string): Promise<string | null> {
  // 1. まず部分一致を試す（高速パス）
  const { data: exact } = await supabase
    .from('projects')
    .select('id')
    .eq('team_id', teamId)
    .ilike('name', `%${searchName}%`)
    .limit(1)
    .single();
  if (exact?.id) return exact.id;

  // 2. 全プロジェクトを取得してあいまいスコアリング
  const { data: all } = await supabase
    .from('projects')
    .select('id, name')
    .eq('team_id', teamId);
  if (!all || all.length === 0) return null;

  const scored = all
    .map((p: { id: string; name: string }) => ({ ...p, score: fuzzyScore(p.name, searchName) }))
    .filter((p: { score: number }) => p.score > 0)
    .sort((a: { score: number }, b: { score: number }) => b.score - a.score);

  return scored.length > 0 ? scored[0].id : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fuzzyFindTask(supabase: any, teamId: string, searchTitle: string): Promise<string | null> {
  // 1. 部分一致（高速パス）
  const { data: exact } = await supabase
    .from('tasks')
    .select('id, projects!inner(team_id)')
    .eq('projects.team_id', teamId)
    .ilike('title', `%${searchTitle}%`)
    .limit(1)
    .single();
  if (exact?.id) return exact.id;

  // 2. 全タスクを取得してあいまいスコアリング
  const { data: all } = await supabase
    .from('tasks')
    .select('id, title, projects!inner(team_id)')
    .eq('projects.team_id', teamId);
  if (!all || all.length === 0) return null;

  const scored = all
    .map((t: { id: string; title: string }) => ({ ...t, score: fuzzyScore(t.title, searchTitle) }))
    .filter((t: { score: number }) => t.score > 0)
    .sort((a: { score: number }, b: { score: number }) => b.score - a.score);

  return scored.length > 0 ? scored[0].id : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeFunction(supabase: any, userId: string, teamId: string, name: string, args: any) {
  switch (name) {
    case 'create_project': {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          team_id: teamId,
          name: args.name,
          description: args.description || null,
          status: args.status || '提案（未定）',
        })
        .select()
        .single();
      if (error) return { error: error.message };
      return { success: true, project: data, contextProject: { id: data.id, name: data.name } };
    }

    case 'list_projects': {
      let query = supabase
        .from('projects')
        .select('*, tasks(id, status, due_date)')
        .eq('team_id', teamId);

      if (args.status) {
        query = query.eq('status', args.status);
      }

      if (args.sort_by === 'name') {
        query = query.order('name');
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) return { error: error.message };

      if (args.sort_by === 'nearest_due') {
        data.sort((a: { tasks: { due_date: string | null; status: string }[] }, b: { tasks: { due_date: string | null; status: string }[] }) => {
          const aDue = a.tasks.filter((t: { due_date: string | null; status: string }) => t.due_date && t.status !== '完了').sort((x: { due_date: string | null }, y: { due_date: string | null }) => new Date(x.due_date!).getTime() - new Date(y.due_date!).getTime())[0];
          const bDue = b.tasks.filter((t: { due_date: string | null; status: string }) => t.due_date && t.status !== '完了').sort((x: { due_date: string | null }, y: { due_date: string | null }) => new Date(x.due_date!).getTime() - new Date(y.due_date!).getTime())[0];
          if (!aDue && !bDue) return 0;
          if (!aDue) return 1;
          if (!bDue) return -1;
          return new Date(aDue.due_date!).getTime() - new Date(bDue.due_date!).getTime();
        });
      }

      return { projects: data };
    }

    case 'update_project': {
      let projectId = args.project_id;
      if (!projectId && args.project_name) {
        projectId = await fuzzyFindProject(supabase, teamId, args.project_name);
      }
      if (!projectId) return { error: 'プロジェクトが見つかりません' };

      const updates: Record<string, string> = {};
      if (args.name) updates.name = args.name;
      if (args.description) updates.description = args.description;
      if (args.status) updates.status = args.status;

      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();
      if (error) return { error: error.message };
      return { success: true, project: data, contextProject: { id: data.id, name: data.name } };
    }

    case 'delete_project': {
      let projectId = args.project_id;
      if (!projectId && args.project_name) {
        projectId = await fuzzyFindProject(supabase, teamId, args.project_name);
      }
      if (!projectId) return { error: 'プロジェクトが見つかりません' };

      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      return error ? { error: error.message } : { success: true };
    }

    case 'create_task': {
      let projectId = args.project_id;
      if (!projectId && args.project_name) {
        projectId = await fuzzyFindProject(supabase, teamId, args.project_name);
      }
      if (!projectId) return { error: 'プロジェクトが見つかりません。プロジェクト名を指定してください。' };

      // プロジェクト名を取得してコンテキストに返す
      const { data: proj } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          user_id: userId,
          title: args.title,
          description: args.description || null,
          priority: args.priority || '中',
          due_date: args.due_date || null,
          status: args.status || '未着手',
        })
        .select()
        .single();
      if (error) return { error: error.message };
      return { success: true, task: data, contextProject: { id: projectId, name: proj?.name || '' } };
    }

    case 'update_task': {
      let taskId = args.task_id;
      if (!taskId && args.task_title) {
        taskId = await fuzzyFindTask(supabase, teamId, args.task_title);
      }
      if (!taskId) return { error: 'タスクが見つかりません' };

      const updates: Record<string, string> = {};
      if (args.title) updates.title = args.title;
      if (args.description) updates.description = args.description;
      if (args.status) updates.status = args.status;
      if (args.priority) updates.priority = args.priority;
      if (args.due_date) updates.due_date = args.due_date;

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();
      return error ? { error: error.message } : { success: true, task: data };
    }

    case 'delete_task': {
      let taskId = args.task_id;
      if (!taskId && args.task_title) {
        taskId = await fuzzyFindTask(supabase, teamId, args.task_title);
      }
      if (!taskId) return { error: 'タスクが見つかりません' };

      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      return error ? { error: error.message } : { success: true };
    }

    case 'list_tasks': {
      let query = supabase.from('tasks').select('*, task_links(*), projects!inner(team_id)').eq('projects.team_id', teamId);

      if (args.project_id) {
        query = query.eq('project_id', args.project_id);
      } else if (args.project_name) {
        const foundProjectId = await fuzzyFindProject(supabase, teamId, args.project_name);
        if (foundProjectId) query = query.eq('project_id', foundProjectId);
      }

      if (args.status) query = query.eq('status', args.status);
      if (args.priority) query = query.eq('priority', args.priority);

      const sortField = args.sort_by || 'due_date';
      if (sortField === 'due_date') {
        query = query.order('due_date', { ascending: true, nullsFirst: false });
      } else {
        query = query.order(sortField, { ascending: true });
      }

      const { data, error } = await query;
      return error ? { error: error.message } : { tasks: data };
    }

    case 'add_task_link': {
      let taskId = args.task_id;
      if (!taskId && args.task_title) {
        taskId = await fuzzyFindTask(supabase, teamId, args.task_title);
      }
      if (!taskId) return { error: 'タスクが見つかりません' };

      const { data, error } = await supabase
        .from('task_links')
        .insert({
          task_id: taskId,
          url: args.url,
          label: args.label || null,
        })
        .select()
        .single();
      return error ? { error: error.message } : { success: true, link: data };
    }

    case 'navigate': {
      const pageMap: Record<string, string> = {
        dashboard: '/dashboard',
        tasks: '/tasks',
        settings: '/settings',
      };
      const basePath = pageMap[args.page] || '/dashboard';
      let url = basePath;

      // タスクページのフィルタ
      if (args.page === 'tasks') {
        const params = new URLSearchParams();

        // 日付フィルタ
        if (args.date_filter) {
          params.set('filter', args.date_filter);
        }

        // プロジェクトフィルタ
        let projectId = args.project_id;
        if (!projectId && args.project_name) {
          projectId = await fuzzyFindProject(supabase, teamId, args.project_name);
        }
        if (projectId) {
          params.set('project', projectId);
        }

        const qs = params.toString();
        if (qs) url = `${basePath}?${qs}`;
      }

      return { success: true, url, message: `${args.page}ページに遷移します` };
    }

    case 'update_settings': {
      const settingsUpdate: Record<string, boolean | string> = {};
      if (args.show_completed !== undefined) {
        settingsUpdate.showCompleted = args.show_completed;
      }
      if (args.show_delivered !== undefined) {
        settingsUpdate.showDelivered = args.show_delivered;
      }
      if (args.task_view) {
        settingsUpdate.taskView = args.task_view;
      }
      return { success: true, settingsUpdate, message: '設定を変更しました' };
    }

    default:
      return { error: `未知の関数: ${name}` };
  }
}

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
import json

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Импортируем существующие функции
from functions.bitrix24_prices import handler as bitrix24_prices_handler
from functions.rss_news import handler as rss_news_handler
from functions.integration_request import handler as integration_request_handler
from functions.telegram_notify import handler as telegram_notify_handler
from functions.bitrix24_webhook import handler as bitrix24_webhook_handler

# Импортируем НОВЫЕ функции для криптобота
from functions.bybit_market import handler as bybit_market_handler
from functions.strategy_signals import handler as strategy_signals_handler
from functions.pair_analyzer import handler as pair_analyzer_handler
from functions.auto_trader import handler as auto_trader_handler

class MockContext:
    def __init__(self, request_id: str):
        self.request_id = request_id
        self.function_name = "python-gateway"
        self.function_version = "1.0"
        self.memory_limit_in_mb = 256

async def fastapi_to_cloud_event(request: Request):
    body = None
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            body = json.dumps(await request.json())
        except:
            body = (await request.body()).decode()

    return {
        "httpMethod": request.method,
        "headers": dict(request.headers),
        "queryStringParameters": dict(request.query_params),
        "body": body,
        "isBase64Encoded": False
    }

# Существующие роуты
@app.api_route("/bitrix24-prices", methods=["GET", "OPTIONS"])
async def bitrix24_prices(request: Request):
    event = await fastapi_to_cloud_event(request)
    context = MockContext(request_id=str(id(request)))
    result = bitrix24_prices_handler(event, context)
    return JSONResponse(
        content=json.loads(result['body']) if result.get('body') else {},
        status_code=result['statusCode'],
        headers=result.get('headers', {})
    )

@app.api_route("/rss-news", methods=["GET", "OPTIONS"])
async def rss_news(request: Request):
    event = await fastapi_to_cloud_event(request)
    context = MockContext(request_id=str(id(request)))
    result = rss_news_handler(event, context)
    return JSONResponse(
        content=json.loads(result['body']) if result.get('body') else {},
        status_code=result['statusCode'],
        headers=result.get('headers', {})
    )

@app.api_route("/integration-request", methods=["POST", "OPTIONS"])
async def integration_request(request: Request):
    event = await fastapi_to_cloud_event(request)
    context = MockContext(request_id=str(id(request)))
    result = integration_request_handler(event, context)
    return JSONResponse(
        content=json.loads(result['body']) if result.get('body') else {},
        status_code=result['statusCode'],
        headers=result.get('headers', {})
    )

@app.api_route("/telegram-notify", methods=["POST", "OPTIONS"])
async def telegram_notify(request: Request):
    event = await fastapi_to_cloud_event(request)
    context = MockContext(request_id=str(id(request)))
    result = telegram_notify_handler(event, context)
    return JSONResponse(
        content=json.loads(result['body']) if result.get('body') else {},
        status_code=result['statusCode'],
        headers=result.get('headers', {})
    )

@app.api_route("/bitrix24-webhook", methods=["POST", "OPTIONS"])
async def bitrix24_webhook(request: Request):
    event = await fastapi_to_cloud_event(request)
    context = MockContext(request_id=str(id(request)))
    result = bitrix24_webhook_handler(event, context)
    return JSONResponse(
        content=json.loads(result['body']) if result.get('body') else {},
        status_code=result['statusCode'],
        headers=result.get('headers', {})
    )

# НОВЫЕ роуты для криптобота
@app.api_route("/bybit-market", methods=["GET", "POST", "OPTIONS"])
async def bybit_market(request: Request):
    event = await fastapi_to_cloud_event(request)
    context = MockContext(request_id=str(id(request)))
    result = bybit_market_handler(event, context)
    return JSONResponse(
        content=json.loads(result['body']) if result.get('body') else {},
        status_code=result['statusCode'],
        headers=result.get('headers', {})
    )

@app.api_route("/strategy-signals", methods=["GET", "OPTIONS"])
async def strategy_signals(request: Request):
    event = await fastapi_to_cloud_event(request)
    context = MockContext(request_id=str(id(request)))
    result = strategy_signals_handler(event, context)
    return JSONResponse(
        content=json.loads(result['body']) if result.get('body') else {},
        status_code=result['statusCode'],
        headers=result.get('headers', {})
    )

@app.api_route("/pair-analyzer", methods=["GET", "OPTIONS"])
async def pair_analyzer(request: Request):
    event = await fastapi_to_cloud_event(request)
    context = MockContext(request_id=str(id(request)))
    result = pair_analyzer_handler(event, context)
    return JSONResponse(
        content=json.loads(result['body']) if result.get('body') else {},
        status_code=result['statusCode'],
        headers=result.get('headers', {})
    )

@app.api_route("/auto-trader", methods=["GET", "POST", "OPTIONS"])
async def auto_trader(request: Request):
    event = await fastapi_to_cloud_event(request)
    context = MockContext(request_id=str(id(request)))
    result = auto_trader_handler(event, context)
    return JSONResponse(
        content=json.loads(result['body']) if result.get('body') else {},
        status_code=result['statusCode'],
        headers=result.get('headers', {})
    )

@app.get("/health")
async def health():
    return {"status": "ok", "service": "python-gateway", "port": 3001}

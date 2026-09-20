# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["src/LogiTrack.Domain/LogiTrack.Domain.csproj", "src/LogiTrack.Domain/"]
COPY ["src/LogiTrack.Application/LogiTrack.Application.csproj", "src/LogiTrack.Application/"]
COPY ["src/LogiTrack.Infrastructure/LogiTrack.Infrastructure.csproj", "src/LogiTrack.Infrastructure/"]
COPY ["src/LogiTrack.Api/LogiTrack.Api.csproj", "src/LogiTrack.Api/"]
COPY ["tests/LogiTrack.Tests/LogiTrack.Tests.csproj", "tests/LogiTrack.Tests/"]

RUN dotnet restore "src/LogiTrack.Api/LogiTrack.Api.csproj"

# Copy full source and build
COPY . .
WORKDIR "/src/src/LogiTrack.Api"
RUN dotnet build "LogiTrack.Api.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "LogiTrack.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=publish /app/publish .
RUN mkdir -p /app/Uploads/documents /app/Uploads/pod /app/Uploads/expenses

ENTRYPOINT ["dotnet", "LogiTrack.Api.dll"]

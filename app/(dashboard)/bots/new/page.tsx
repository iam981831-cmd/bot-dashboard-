import { BotForm } from "@/components/bot-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewBotPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/bots">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Bots
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Add New Bot</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Register a new bot to track and monitor
        </p>
      </div>
      <BotForm mode="create" />
    </div>
  )
}

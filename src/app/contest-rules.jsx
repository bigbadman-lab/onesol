import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Home } from "lucide-react-native";

export default function ContestRules() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Home icon - top left */}
        <TouchableOpacity
          onPress={() => router.push("/home")}
          style={{
            position: "absolute",
            top: insets.top + 20,
            left: 20,
            zIndex: 10,
          }}
        >
          <Home size={32} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Close icon */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            position: "absolute",
            top: insets.top + 20,
            right: 20,
            zIndex: 10,
          }}
        >
          <X size={32} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Header */}
        <View style={{ alignItems: "center", marginTop: 20, marginBottom: 40 }}>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "900",
              color: "#FFFFFF",
              textAlign: "center",
            }}
          >
            Official Contest Rules
          </Text>
        </View>

        {/* Content */}
        <View style={{ marginHorizontal: 20 }}>
          {/* Sponsor Section */}
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 16,
              padding: 24,
              marginBottom: 20,
              borderWidth: 2,
              borderColor: "#7B68EE",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
                marginBottom: 12,
              }}
            >
              SPONSOR
            </Text>
            <Text style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 24 }}>
              One Sol a trading style of Mobx Ltd
              {"\n"}
              Contact: hello@1sol.fun
            </Text>
            <View
              style={{
                height: 1,
                backgroundColor: "#333333",
                marginVertical: 16,
              }}
            />
            <Text
              style={{
                fontSize: 14,
                color: "#999999",
                fontStyle: "italic",
                lineHeight: 20,
              }}
            >
              Apple is not a sponsor or involved in this activity in any manner.
            </Text>
          </View>

          {/* Contest Description */}
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 16,
              padding: 24,
              marginBottom: 20,
              borderWidth: 2,
              borderColor: "#333333",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
                marginBottom: 12,
              }}
            >
              CONTEST DESCRIPTION
            </Text>
            <Text style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 24 }}>
              The Daily Leaderboard Challenge is a skill-based contest where
              participants compete to achieve the highest score by correctly
              predicting chart patterns in simulated trading scenarios. One
              winner is selected daily based on their leaderboard ranking.
            </Text>
          </View>

          {/* Eligibility */}
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 16,
              padding: 24,
              marginBottom: 20,
              borderWidth: 2,
              borderColor: "#333333",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
                marginBottom: 12,
              }}
            >
              ELIGIBILITY
            </Text>
            <Text style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 24 }}>
              • Must be 13 years of age or older
              {"\n"}• Contest is open worldwide
              {"\n"}• Employees of the Sponsor and their immediate families are
              not eligible
              {"\n"}• Must have a valid email address to claim prizes
              {"\n"}• Must comply with all applicable laws and regulations
            </Text>
          </View>

          {/* How to Enter */}
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 16,
              padding: 24,
              marginBottom: 20,
              borderWidth: 2,
              borderColor: "#333333",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
                marginBottom: 12,
              }}
            >
              HOW TO ENTER
            </Text>
            <Text style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 24 }}>
              1. Download and install the app
              {"\n"}2. Play the game and complete trading sessions
              {"\n"}3. Your score is automatically submitted to the leaderboard
              {"\n"}4. Add your email address in Settings to be eligible for
              prizes
              {"\n"}5. No purchase necessary to enter or win
            </Text>
          </View>

          {/* Winner Selection */}
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 16,
              padding: 24,
              marginBottom: 20,
              borderWidth: 2,
              borderColor: "#333333",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
                marginBottom: 12,
              }}
            >
              WINNER SELECTION
            </Text>
            <Text style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 24 }}>
              • One winner is selected daily
              {"\n"}• Winner is determined by the highest final SOL balance
              (final_sol) on the leaderboard for that day
              {"\n"}• In case of a tie, the winner will be determined by the
              highest correct count (correct_count)
              {"\n"}• If still tied, the earliest submission time will determine
              the winner
              {"\n"}• Winners are selected at the end of each contest day
              {"\n"}• Contest day resets daily at midnight local time
            </Text>
          </View>

          {/* Prizes */}
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 16,
              padding: 24,
              marginBottom: 20,
              borderWidth: 2,
              borderColor: "#7B68EE",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
                marginBottom: 12,
              }}
            >
              PRIZES
            </Text>
            <Text style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 24 }}>
              • Daily Prize: 50% of fees generated from the official $ONESOL
              token for that day
              {"\n"}• Prize value varies daily based on token fees
              {"\n"}• Prize will be distributed in cryptocurrency (SOL or $ONESOL)
              {"\n"}• Prize amount will be calculated and confirmed after the
              contest day ends
              {"\n"}• Only one prize per person per day
            </Text>
          </View>

          {/* Claim Process */}
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 16,
              padding: 24,
              marginBottom: 20,
              borderWidth: 2,
              borderColor: "#333333",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
                marginBottom: 12,
              }}
            >
              CLAIM PROCESS
            </Text>
            <Text style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 24 }}>
              • Winners will be notified via email within 24 hours of selection
              {"\n"}• Winners must respond to the notification email within 14
              days to claim their prize
              {"\n"}• Winners must provide a valid cryptocurrency wallet
              address to receive the prize
              {"\n"}• Prizes will be distributed within 30 days of claim
              confirmation
              {"\n"}• If a winner does not claim within 14 days, the prize may
              be forfeited
            </Text>
          </View>

          {/* Disqualification */}
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 16,
              padding: 24,
              marginBottom: 20,
              borderWidth: 2,
              borderColor: "#333333",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
                marginBottom: 12,
              }}
            >
              DISQUALIFICATION
            </Text>
            <Text style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 24 }}>
              Participants may be disqualified for:
              {"\n"}• Cheating, fraud, or use of automated systems
              {"\n"}• Violation of these rules or terms of service
              {"\n"}• Providing false information
              {"\n"}• Any activity that undermines the integrity of the contest
            </Text>
          </View>

          {/* General Terms */}
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 16,
              padding: 24,
              marginBottom: 20,
              borderWidth: 2,
              borderColor: "#333333",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
                marginBottom: 12,
              }}
            >
              GENERAL TERMS
            </Text>
            <Text style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 24 }}>
              • By participating, you agree to these official rules
              {"\n"}• Sponsor reserves the right to modify or cancel the
              contest at any time
              {"\n"}• All decisions by the Sponsor are final
              {"\n"}• Taxes on prizes are the sole responsibility of the winner
              {"\n"}• Void where prohibited by law
              {"\n"}• Contest is subject to all applicable federal, state, and
              local laws
            </Text>
          </View>

          {/* Contact */}
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 16,
              padding: 24,
              marginBottom: 40,
              borderWidth: 2,
              borderColor: "#333333",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#7B68EE",
                marginBottom: 12,
              }}
            >
              QUESTIONS?
            </Text>
            <Text style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 24 }}>
              For questions about this contest, contact:
              {"\n"}
              hello@1sol.fun
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
